package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Attendance;
import com.ultron.backend.domain.entity.AttendanceRegularization;
import com.ultron.backend.domain.entity.User;
import com.ultron.backend.domain.enums.RegularizationStatus;
import com.ultron.backend.dto.regularization.ApproveRegularizationRequest;
import com.ultron.backend.dto.regularization.CreateRegularizationRequest;
import com.ultron.backend.dto.regularization.RegularizationResponse;
import com.ultron.backend.exception.BusinessException;
import com.ultron.backend.repository.AttendanceRegularizationRepository;
import com.ultron.backend.repository.AttendanceRepository;
import com.ultron.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for attendance regularization operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AttendanceRegularizationService extends BaseTenantService {

    private final AttendanceRegularizationRepository regularizationRepository;
    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final RegularizationIdGeneratorService regularizationIdGeneratorService;
    private final NotificationService notificationService;

    /**
     * Request attendance regularization
     */
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "dailyAttendance", allEntries = true),
            @CacheEvict(value = "monthlyReport", allEntries = true)
    })
    public RegularizationResponse requestRegularization(
            CreateRegularizationRequest request, String userId) {
        String tenantId = getCurrentTenantId();
        log.info("User {} requesting regularization for date: {}", userId, request.getAttendanceDate());

        // Validate date is not too old (e.g., within last 7 days)
        if (request.getAttendanceDate().isBefore(java.time.LocalDate.now().minusDays(7))) {
            throw new BusinessException("Cannot request regularization for dates older than 7 days");
        }

        // Get user details
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new BusinessException("User not found"));

        String userName = user.getFullName() != null ? user.getFullName() :
                (user.getProfile() != null && user.getProfile().getFullName() != null) ?
                        user.getProfile().getFullName() : user.getUsername();

        // Get or validate attendance record
        Attendance attendance = null;
        if (request.getAttendanceId() != null) {
            attendance = attendanceRepository.findByAttendanceIdAndTenantId(
                    request.getAttendanceId(), tenantId)
                    .orElseThrow(() -> new BusinessException("Attendance record not found"));

            if (!attendance.getUserId().equals(userId)) {
                throw new BusinessException("You can only request regularization for your own attendance");
            }
        }

        // Check if already has pending regularization for this date
        List<AttendanceRegularization> existing = regularizationRepository
                .findByUserIdAndTenantIdAndStatusAndIsDeletedFalse(
                        userId, tenantId, RegularizationStatus.PENDING);

        boolean hasPending = existing.stream()
                .anyMatch(r -> r.getAttendanceDate().equals(request.getAttendanceDate()));

        if (hasPending) {
            throw new BusinessException("You already have a pending regularization for this date");
        }

        // Create regularization request
        AttendanceRegularization regularization = AttendanceRegularization.builder()
                .regularizationId(regularizationIdGeneratorService.generateRegularizationId())
                .tenantId(tenantId)
                .attendanceId(request.getAttendanceId())
                .userId(userId)
                .userName(userName)
                .userEmail(user.getEmail())
                .attendanceDate(request.getAttendanceDate())
                .type(request.getType())
                .requestedCheckInTime(request.getRequestedCheckInTime())
                .requestedCheckOutTime(request.getRequestedCheckOutTime())
                .originalCheckInTime(attendance != null ? attendance.getCheckInTime() : null)
                .originalCheckOutTime(attendance != null ? attendance.getCheckOutTime() : null)
                .requestedLatitude(request.getRequestedLatitude())
                .requestedLongitude(request.getRequestedLongitude())
                .requestedAddress(request.getRequestedAddress())
                .reason(request.getReason())
                .supportingDocuments(request.getSupportingDocuments() != null
                        ? request.getSupportingDocuments() : new ArrayList<>())
                .status(RegularizationStatus.PENDING)
                .approverId(user.getManagerId())
                .isAutoApproved(false)
                .createdAt(LocalDateTime.now())
                .createdBy(userId)
                .isDeleted(false)
                .build();

        regularizationRepository.save(regularization);

        // Send notification to manager
        if (user.getManagerId() != null) {
            notificationService.createAndSendNotification(
                    user.getManagerId(),
                    "Attendance Regularization Request",
                    String.format("%s has requested attendance regularization for %s (%s)",
                            userName,
                            request.getAttendanceDate(),
                            request.getType().getDisplayName()),
                    "REGULARIZATION_REQUEST",
                    "/admin/attendance/regularizations/" + regularization.getRegularizationId()
            );
        }

        log.info("Regularization created: {} for user: {}", regularization.getRegularizationId(), userId);
        return mapToResponse(regularization);
    }

    /**
     * Approve or reject regularization
     */
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "dailyAttendance", allEntries = true),
            @CacheEvict(value = "monthlyReport", allEntries = true)
    })
    public RegularizationResponse approveRegularization(
            ApproveRegularizationRequest request, String managerId) {
        String tenantId = getCurrentTenantId();
        log.info("Manager {} processing regularization: {}", managerId, request.getRegularizationId());

        AttendanceRegularization regularization = regularizationRepository
                .findByRegularizationIdAndTenantId(request.getRegularizationId(), tenantId)
                .orElseThrow(() -> new BusinessException("Regularization not found"));

        if (regularization.getStatus() != RegularizationStatus.PENDING) {
            throw new BusinessException("Regularization is not in pending status");
        }

        User manager = userRepository.findByIdAndTenantId(managerId, tenantId)
                .orElseThrow(() -> new BusinessException("Manager not found"));

        String managerName = manager.getFullName() != null ? manager.getFullName() :
                (manager.getProfile() != null && manager.getProfile().getFullName() != null) ?
                        manager.getProfile().getFullName() : manager.getUsername();

        regularization.setStatus(request.getApproved()
                ? RegularizationStatus.APPROVED : RegularizationStatus.REJECTED);
        regularization.setApproverId(managerId);
        regularization.setApproverName(managerName);
        regularization.setApprovedAt(LocalDateTime.now());
        regularization.setApprovalNotes(request.getNotes());
        regularization.setRejectionReason(request.getRejectionReason());
        regularization.setLastModifiedAt(LocalDateTime.now());
        regularization.setLastModifiedBy(managerId);

        if (request.getApproved()) {
            // Apply regularization to attendance record
            applyRegularization(regularization);
            regularization.setSystemNotes("Regularization applied to attendance record");
        } else {
            regularization.setSystemNotes("Regularization rejected");
        }

        regularizationRepository.save(regularization);

        // Send notification to employee
        notificationService.createAndSendNotification(
                regularization.getUserId(),
                request.getApproved() ? "Regularization Approved" : "Regularization Rejected",
                String.format("Your attendance regularization for %s has been %s",
                        regularization.getAttendanceDate(),
                        request.getApproved() ? "approved" : "rejected"),
                request.getApproved() ? "REGULARIZATION_APPROVED" : "REGULARIZATION_REJECTED",
                "/attendance/regularizations/" + regularization.getRegularizationId()
        );

        log.info("Regularization {} for user: {}",
                request.getApproved() ? "approved" : "rejected", regularization.getUserId());
        return mapToResponse(regularization);
    }

    /**
     * Get user's regularizations
     */
    public List<RegularizationResponse> getMyRegularizations(String userId) {
        String tenantId = getCurrentTenantId();
        List<AttendanceRegularization> regularizations = regularizationRepository
                .findByUserIdAndTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(userId, tenantId);
        return regularizations.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Get regularization by ID
     */
    public RegularizationResponse getRegularizationById(String regularizationId) {
        String tenantId = getCurrentTenantId();
        AttendanceRegularization regularization = regularizationRepository
                .findByRegularizationIdAndTenantId(regularizationId, tenantId)
                .orElseThrow(() -> new BusinessException("Regularization not found"));
        return mapToResponse(regularization);
    }

    /**
     * Get pending approvals (manager)
     */
    public List<RegularizationResponse> getPendingApprovals(String managerId) {
        String tenantId = getCurrentTenantId();
        List<AttendanceRegularization> regularizations = regularizationRepository
                .findByApproverIdAndTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(
                        managerId, tenantId, RegularizationStatus.PENDING);
        return regularizations.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Get all pending regularizations (admin)
     */
    public List<RegularizationResponse> getAllPendingRegularizations() {
        String tenantId = getCurrentTenantId();
        List<AttendanceRegularization> regularizations = regularizationRepository
                .findByTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(
                        tenantId, RegularizationStatus.PENDING);
        return regularizations.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // Helper methods

    private void applyRegularization(AttendanceRegularization regularization) {
        String tenantId = getCurrentTenantId();

        // Get or create attendance record
        Optional<Attendance> existingAtt = attendanceRepository
                .findByUserIdAndAttendanceDateAndTenantIdAndIsDeletedFalse(
                        regularization.getUserId(),
                        regularization.getAttendanceDate(),
                        tenantId);

        Attendance attendance;
        if (existingAtt.isPresent()) {
            attendance = existingAtt.get();
        } else {
            // Create new attendance record for missed check-in
            attendance = Attendance.builder()
                    .attendanceId("ATT-" + regularization.getAttendanceDate() + "-" +
                            regularization.getUserId().substring(0, 8))
                    .tenantId(tenantId)
                    .userId(regularization.getUserId())
                    .attendanceDate(regularization.getAttendanceDate())
                    .systemNotes("Created via regularization: " + regularization.getRegularizationId())
                    .createdAt(LocalDateTime.now())
                    .createdBy("SYSTEM")
                    .isDeleted(false)
                    .build();
        }

        // Apply requested changes
        switch (regularization.getType()) {
            case MISSED_CHECKIN:
            case WRONG_TIME:
                if (regularization.getRequestedCheckInTime() != null) {
                    attendance.setCheckInTime(regularization.getRequestedCheckInTime());
                }
                break;

            case MISSED_CHECKOUT:
            case FORGOT_CHECKOUT:
                if (regularization.getRequestedCheckOutTime() != null) {
                    attendance.setCheckOutTime(regularization.getRequestedCheckOutTime());
                }
                break;

            case WRONG_LOCATION:
                // Update location information
                if (attendance.getCheckInLocation() != null && regularization.getRequestedLatitude() != null) {
                    attendance.getCheckInLocation().setLatitude(regularization.getRequestedLatitude());
                    attendance.getCheckInLocation().setLongitude(regularization.getRequestedLongitude());
                }
                break;
        }

        // Add regularization note
        String note = String.format("Regularized: %s - %s",
                regularization.getType().getDisplayName(),
                regularization.getReason());
        attendance.setManagerNotes(
                (attendance.getManagerNotes() != null ? attendance.getManagerNotes() + "; " : "") + note);

        attendance.setLastModifiedAt(LocalDateTime.now());
        attendance.setLastModifiedBy("SYSTEM_REGULARIZATION");

        attendanceRepository.save(attendance);
    }

    private RegularizationResponse mapToResponse(AttendanceRegularization regularization) {
        return RegularizationResponse.builder()
                .id(regularization.getId())
                .regularizationId(regularization.getRegularizationId())
                .tenantId(regularization.getTenantId())
                .attendanceId(regularization.getAttendanceId())
                .userId(regularization.getUserId())
                .userName(regularization.getUserName())
                .userEmail(regularization.getUserEmail())
                .attendanceDate(regularization.getAttendanceDate())
                .type(regularization.getType())
                .requestedCheckInTime(regularization.getRequestedCheckInTime())
                .requestedCheckOutTime(regularization.getRequestedCheckOutTime())
                .originalCheckInTime(regularization.getOriginalCheckInTime())
                .originalCheckOutTime(regularization.getOriginalCheckOutTime())
                .requestedLatitude(regularization.getRequestedLatitude())
                .requestedLongitude(regularization.getRequestedLongitude())
                .requestedAddress(regularization.getRequestedAddress())
                .reason(regularization.getReason())
                .supportingDocuments(regularization.getSupportingDocuments())
                .status(regularization.getStatus())
                .approverId(regularization.getApproverId())
                .approverName(regularization.getApproverName())
                .approvedAt(regularization.getApprovedAt())
                .approvalNotes(regularization.getApprovalNotes())
                .rejectionReason(regularization.getRejectionReason())
                .managerNotes(regularization.getManagerNotes())
                .systemNotes(regularization.getSystemNotes())
                .isAutoApproved(regularization.getIsAutoApproved())
                .autoApprovalReason(regularization.getAutoApprovalReason())
                .createdAt(regularization.getCreatedAt())
                .createdBy(regularization.getCreatedBy())
                .lastModifiedAt(regularization.getLastModifiedAt())
                .lastModifiedBy(regularization.getLastModifiedBy())
                .build();
    }
}
