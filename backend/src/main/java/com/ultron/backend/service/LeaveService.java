package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Attendance;
import com.ultron.backend.domain.entity.Leave;
import com.ultron.backend.domain.entity.LeaveBalance;
import com.ultron.backend.domain.entity.User;
import com.ultron.backend.domain.enums.AttendanceStatus;
import com.ultron.backend.domain.enums.LeaveStatus;
import com.ultron.backend.domain.enums.LeaveType;
import com.ultron.backend.dto.leave.*;
import com.ultron.backend.exception.BusinessException;
import com.ultron.backend.multitenancy.TenantContext;
import com.ultron.backend.repository.AttendanceRepository;
import com.ultron.backend.repository.LeaveBalanceRepository;
import com.ultron.backend.repository.LeaveRepository;
import com.ultron.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for leave management operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LeaveService extends BaseTenantService {

    private final LeaveRepository leaveRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final LeaveIdGeneratorService leaveIdGeneratorService;
    private final NotificationService notificationService;
    private final HolidayService holidayService;

    /**
     * Apply for leave
     */
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "leaveBalance", key = "T(com.ultron.backend.multitenancy.TenantContext).getTenantId() + '_' + #userId"),
            @CacheEvict(value = "userLeaves", key = "T(com.ultron.backend.multitenancy.TenantContext).getTenantId() + '_' + #userId")
    })
    public LeaveResponse applyLeave(CreateLeaveRequest request, String userId) {
        String tenantId = getTenantId();
        log.info("Applying leave for user: {} in tenant: {}", userId, tenantId);

        // Validate dates
        validateLeaveDates(request);

        // Get user details
        User user = userRepository.findByIdAndTenantIdAndIsDeletedFalse(userId, tenantId)
                .orElseThrow(() -> new BusinessException("User not found"));

        // Calculate total days
        Double totalDays = calculateTotalDays(request);
        Integer businessDays = calculateBusinessDays(request.getStartDate(), request.getEndDate());

        // Check for overlapping leaves
        checkOverlappingLeaves(userId, request.getStartDate(), request.getEndDate());

        // Check leave balance
        checkLeaveBalance(userId, request.getLeaveType(), totalDays);

        // Get or create leave balance for current year
        int year = request.getStartDate().getYear();
        LeaveBalance leaveBalance = getOrCreateLeaveBalance(userId, user.getName(), year);

        // Get balance before
        Double balanceBefore = leaveBalance.getBalances().get(request.getLeaveType()).getAvailable();

        // Update pending balance
        updateBalanceForPending(leaveBalance, request.getLeaveType(), totalDays);
        leaveBalanceRepository.save(leaveBalance);

        // Create leave record
        Leave leave = Leave.builder()
                .leaveId(leaveIdGeneratorService.generateLeaveId())
                .tenantId(tenantId)
                .userId(userId)
                .userName(user.getName())
                .userEmail(user.getEmail())
                .leaveType(request.getLeaveType())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .totalDays(totalDays)
                .businessDays(businessDays)
                .isHalfDay(request.getIsHalfDay() != null && request.getIsHalfDay())
                .halfDayType(request.getHalfDayType())
                .reason(request.getReason())
                .attachments(request.getAttachments() != null ? request.getAttachments() : new ArrayList<>())
                .status(LeaveStatus.PENDING)
                .approverId(user.getManagerId())
                .isEmergencyLeave(request.getIsEmergencyLeave() != null && request.getIsEmergencyLeave())
                .emergencyContactNumber(request.getEmergencyContactNumber())
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceBefore - totalDays)
                .contactNumberDuringLeave(request.getContactNumberDuringLeave())
                .alternateEmail(request.getAlternateEmail())
                .isCancelled(false)
                .createdAt(LocalDateTime.now())
                .createdBy(userId)
                .isDeleted(false)
                .build();

        leaveRepository.save(leave);

        // Send notification to manager
        if (user.getManagerId() != null) {
            notificationService.createAndSendNotification(
                    user.getManagerId(),
                    "New Leave Request",
                    String.format("%s has applied for %s from %s to %s",
                            user.getName(),
                            request.getLeaveType().getDisplayName(),
                            request.getStartDate(),
                            request.getEndDate()),
                    "LEAVE_APPLIED",
                    "/leaves/approvals/" + leave.getLeaveId()
            );
        }

        log.info("Leave created successfully: {} for user: {}", leave.getLeaveId(), userId);
        return mapToResponse(leave);
    }

    /**
     * Approve or reject leave
     */
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "leaveBalance", allEntries = true),
            @CacheEvict(value = "userLeaves", allEntries = true),
            @CacheEvict(value = "dailyAttendance", allEntries = true)
    })
    public LeaveResponse approveLeave(ApproveLeaveRequest request, String managerId) {
        String tenantId = getTenantId();
        log.info("Processing leave approval: {} by manager: {}", request.getLeaveId(), managerId);

        Leave leave = leaveRepository.findByLeaveIdAndTenantId(request.getLeaveId(), tenantId)
                .orElseThrow(() -> new BusinessException("Leave not found"));

        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new BusinessException("Leave is not in pending status");
        }

        User manager = userRepository.findByIdAndTenantIdAndIsDeletedFalse(managerId, tenantId)
                .orElseThrow(() -> new BusinessException("Manager not found"));

        leave.setStatus(request.getApproved() ? LeaveStatus.APPROVED : LeaveStatus.REJECTED);
        leave.setApproverId(managerId);
        leave.setApproverName(manager.getName());
        leave.setApprovedAt(LocalDateTime.now());
        leave.setApprovalNotes(request.getNotes());
        leave.setRejectionReason(request.getRejectionReason());
        leave.setLastModifiedAt(LocalDateTime.now());
        leave.setLastModifiedBy(managerId);

        // Update leave balance
        int year = leave.getStartDate().getYear();
        LeaveBalance leaveBalance = getOrCreateLeaveBalance(leave.getUserId(), leave.getUserName(), year);

        if (request.getApproved()) {
            // Approve: Move from pending to used
            updateBalanceForApproval(leaveBalance, leave.getLeaveType(), leave.getTotalDays());

            // Create attendance records for leave dates
            createLeaveAttendanceRecords(leave);

            leave.setSystemNotes("Leave approved and attendance records created");
        } else {
            // Reject: Restore from pending to available
            updateBalanceForRejection(leaveBalance, leave.getLeaveType(), leave.getTotalDays());

            leave.setSystemNotes("Leave rejected and balance restored");
        }

        leaveBalanceRepository.save(leaveBalance);
        leaveRepository.save(leave);

        // Send notification to employee
        notificationService.createAndSendNotification(
                leave.getUserId(),
                request.getApproved() ? "Leave Approved" : "Leave Rejected",
                String.format("Your %s from %s to %s has been %s",
                        leave.getLeaveType().getDisplayName(),
                        leave.getStartDate(),
                        leave.getEndDate(),
                        request.getApproved() ? "approved" : "rejected"),
                request.getApproved() ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
                "/leaves/" + leave.getLeaveId()
        );

        log.info("Leave {} for user: {}", request.getApproved() ? "approved" : "rejected", leave.getUserId());
        return mapToResponse(leave);
    }

    /**
     * Cancel leave
     */
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "leaveBalance", key = "T(com.ultron.backend.multitenancy.TenantContext).getTenantId() + '_' + #userId"),
            @CacheEvict(value = "userLeaves", key = "T(com.ultron.backend.multitenancy.TenantContext).getTenantId() + '_' + #userId"),
            @CacheEvict(value = "dailyAttendance", allEntries = true)
    })
    public LeaveResponse cancelLeave(CancelLeaveRequest request, String userId) {
        String tenantId = getTenantId();
        log.info("Cancelling leave: {} by user: {}", request.getLeaveId(), userId);

        Leave leave = leaveRepository.findByLeaveIdAndTenantId(request.getLeaveId(), tenantId)
                .orElseThrow(() -> new BusinessException("Leave not found"));

        if (!leave.getUserId().equals(userId)) {
            throw new BusinessException("You can only cancel your own leaves");
        }

        if (leave.getStatus() != LeaveStatus.PENDING && leave.getStatus() != LeaveStatus.APPROVED) {
            throw new BusinessException("Only pending or approved leaves can be cancelled");
        }

        // Check if leave has already started
        if (leave.getStartDate().isBefore(LocalDate.now())) {
            throw new BusinessException("Cannot cancel leave that has already started");
        }

        LeaveStatus previousStatus = leave.getStatus();
        leave.setStatus(LeaveStatus.CANCELLED);
        leave.setIsCancelled(true);
        leave.setCancelledAt(LocalDateTime.now());
        leave.setCancelledBy(userId);
        leave.setCancellationReason(request.getCancellationReason());
        leave.setLastModifiedAt(LocalDateTime.now());
        leave.setLastModifiedBy(userId);

        // Restore leave balance
        int year = leave.getStartDate().getYear();
        LeaveBalance leaveBalance = getOrCreateLeaveBalance(leave.getUserId(), leave.getUserName(), year);

        if (previousStatus == LeaveStatus.PENDING) {
            // Restore from pending
            updateBalanceForRejection(leaveBalance, leave.getLeaveType(), leave.getTotalDays());
        } else if (previousStatus == LeaveStatus.APPROVED) {
            // Restore from used
            updateBalanceForCancellation(leaveBalance, leave.getLeaveType(), leave.getTotalDays());

            // Delete attendance records created for this leave
            deleteLeaveAttendanceRecords(leave);
        }

        leaveBalanceRepository.save(leaveBalance);
        leaveRepository.save(leave);

        // Notify manager
        if (leave.getApproverId() != null) {
            notificationService.createAndSendNotification(
                    leave.getApproverId(),
                    "Leave Cancelled",
                    String.format("%s has cancelled their %s from %s to %s",
                            leave.getUserName(),
                            leave.getLeaveType().getDisplayName(),
                            leave.getStartDate(),
                            leave.getEndDate()),
                    "LEAVE_CANCELLED",
                    "/leaves/" + leave.getLeaveId()
            );
        }

        log.info("Leave cancelled successfully: {}", leave.getLeaveId());
        return mapToResponse(leave);
    }

    /**
     * Get user's leaves
     */
    @Cacheable(value = "userLeaves", key = "T(com.ultron.backend.multitenancy.TenantContext).getTenantId() + '_' + #userId")
    public List<LeaveResponse> getMyLeaves(String userId) {
        String tenantId = getTenantId();
        List<Leave> leaves = leaveRepository.findByUserIdAndTenantIdAndIsDeletedFalseOrderByStartDateDesc(userId, tenantId);
        return leaves.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Get leave by ID
     */
    public LeaveResponse getLeaveById(String leaveId) {
        String tenantId = getTenantId();
        Leave leave = leaveRepository.findByLeaveIdAndTenantId(leaveId, tenantId)
                .orElseThrow(() -> new BusinessException("Leave not found"));
        return mapToResponse(leave);
    }

    /**
     * Get user's leave balance
     */
    @Cacheable(value = "leaveBalance", key = "T(com.ultron.backend.multitenancy.TenantContext).getTenantId() + '_' + #userId + '_' + #year")
    public LeaveBalanceResponse getMyBalance(String userId, Integer year) {
        String tenantId = getTenantId();
        User user = userRepository.findByIdAndTenantIdAndIsDeletedFalse(userId, tenantId)
                .orElseThrow(() -> new BusinessException("User not found"));

        LeaveBalance balance = getOrCreateLeaveBalance(userId, user.getName(), year);
        return mapToBalanceResponse(balance);
    }

    /**
     * Get pending approvals for manager
     */
    public List<LeaveResponse> getPendingApprovals(String managerId) {
        String tenantId = getTenantId();
        List<Leave> leaves = leaveRepository.findByApproverIdAndTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(
                managerId, tenantId, LeaveStatus.PENDING);
        return leaves.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Get all pending approvals (admin)
     */
    public List<LeaveResponse> getAllPendingApprovals() {
        String tenantId = getTenantId();
        List<Leave> leaves = leaveRepository.findByTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(
                tenantId, LeaveStatus.PENDING);
        return leaves.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // Helper methods

    private void validateLeaveDates(CreateLeaveRequest request) {
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BusinessException("End date cannot be before start date");
        }

        if (request.getIsHalfDay() != null && request.getIsHalfDay()) {
            if (!request.getStartDate().equals(request.getEndDate())) {
                throw new BusinessException("Half day leave must be for a single day");
            }
            if (request.getHalfDayType() == null) {
                throw new BusinessException("Half day type is required for half day leave");
            }
        }
    }

    private Double calculateTotalDays(CreateLeaveRequest request) {
        if (request.getIsHalfDay() != null && request.getIsHalfDay()) {
            return 0.5;
        }
        return (double) calculateBusinessDays(request.getStartDate(), request.getEndDate());
    }

    /**
     * Calculate business days excluding weekends and holidays
     */
    public Integer calculateBusinessDays(LocalDate startDate, LocalDate endDate) {
        int businessDays = 0;
        LocalDate current = startDate;

        while (!current.isAfter(endDate)) {
            DayOfWeek dayOfWeek = current.getDayOfWeek();
            if (dayOfWeek != DayOfWeek.SATURDAY && dayOfWeek != DayOfWeek.SUNDAY) {
                if (!holidayService.isHoliday(current)) {
                    businessDays++;
                }
            }
            current = current.plusDays(1);
        }

        return businessDays;
    }

    private void checkOverlappingLeaves(String userId, LocalDate startDate, LocalDate endDate) {
        String tenantId = getTenantId();
        List<LeaveStatus> activeStatuses = Arrays.asList(LeaveStatus.PENDING, LeaveStatus.APPROVED);

        List<Leave> overlappingLeaves = leaveRepository
                .findByUserIdAndTenantIdAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqualAndIsDeletedFalse(
                        userId, tenantId, activeStatuses, endDate, startDate);

        if (!overlappingLeaves.isEmpty()) {
            throw new BusinessException("You have already applied for leave during this period");
        }
    }

    private void checkLeaveBalance(String userId, LeaveType leaveType, Double requiredDays) {
        String tenantId = getTenantId();
        int year = LocalDate.now().getYear();

        User user = userRepository.findByIdAndTenantIdAndIsDeletedFalse(userId, tenantId)
                .orElseThrow(() -> new BusinessException("User not found"));

        LeaveBalance balance = getOrCreateLeaveBalance(userId, user.getName(), year);
        LeaveBalance.LeaveTypeBalance typeBalance = balance.getBalances().get(leaveType);

        if (typeBalance == null) {
            throw new BusinessException("Leave type not configured for user");
        }

        if (typeBalance.getAvailable() < requiredDays) {
            throw new BusinessException(String.format(
                    "Insufficient leave balance. Required: %.1f, Available: %.1f",
                    requiredDays, typeBalance.getAvailable()));
        }
    }

    private LeaveBalance getOrCreateLeaveBalance(String userId, String userName, Integer year) {
        String tenantId = getTenantId();

        return leaveBalanceRepository.findByTenantIdAndUserIdAndYear(tenantId, userId, year)
                .orElseGet(() -> {
                    LeaveBalance newBalance = LeaveBalance.initializeDefaultBalance(tenantId, userId, userName, year);
                    return leaveBalanceRepository.save(newBalance);
                });
    }

    private void updateBalanceForPending(LeaveBalance balance, LeaveType leaveType, Double days) {
        LeaveBalance.LeaveTypeBalance typeBalance = balance.getBalances().get(leaveType);
        typeBalance.setPending(typeBalance.getPending() + days);
        typeBalance.setAvailable(typeBalance.getTotal() - typeBalance.getUsed() - typeBalance.getPending());
        typeBalance.setLastUpdated(LocalDateTime.now());
    }

    private void updateBalanceForApproval(LeaveBalance balance, LeaveType leaveType, Double days) {
        LeaveBalance.LeaveTypeBalance typeBalance = balance.getBalances().get(leaveType);
        typeBalance.setPending(typeBalance.getPending() - days);
        typeBalance.setUsed(typeBalance.getUsed() + days);
        typeBalance.setAvailable(typeBalance.getTotal() - typeBalance.getUsed() - typeBalance.getPending());
        typeBalance.setLastUpdated(LocalDateTime.now());
    }

    private void updateBalanceForRejection(LeaveBalance balance, LeaveType leaveType, Double days) {
        LeaveBalance.LeaveTypeBalance typeBalance = balance.getBalances().get(leaveType);
        typeBalance.setPending(typeBalance.getPending() - days);
        typeBalance.setAvailable(typeBalance.getTotal() - typeBalance.getUsed() - typeBalance.getPending());
        typeBalance.setLastUpdated(LocalDateTime.now());
    }

    private void updateBalanceForCancellation(LeaveBalance balance, LeaveType leaveType, Double days) {
        LeaveBalance.LeaveTypeBalance typeBalance = balance.getBalances().get(leaveType);
        typeBalance.setUsed(typeBalance.getUsed() - days);
        typeBalance.setAvailable(typeBalance.getTotal() - typeBalance.getUsed() - typeBalance.getPending());
        typeBalance.setLastUpdated(LocalDateTime.now());
    }

    private void createLeaveAttendanceRecords(Leave leave) {
        String tenantId = getTenantId();
        LocalDate current = leave.getStartDate();

        while (!current.isAfter(leave.getEndDate())) {
            DayOfWeek dayOfWeek = current.getDayOfWeek();
            if (dayOfWeek != DayOfWeek.SATURDAY && dayOfWeek != DayOfWeek.SUNDAY && !holidayService.isHoliday(current)) {
                // Check if attendance record already exists
                Optional<Attendance> existing = attendanceRepository
                        .findByUserIdAndAttendanceDateAndTenantIdAndIsDeletedFalse(
                                leave.getUserId(), current, tenantId);

                if (existing.isEmpty()) {
                    Attendance attendance = Attendance.builder()
                            .attendanceId("ATT-" + current + "-" + leave.getLeaveId())
                            .tenantId(tenantId)
                            .userId(leave.getUserId())
                            .attendanceDate(current)
                            .status(AttendanceStatus.ON_LEAVE)
                            .leaveId(leave.getLeaveId())
                            .systemNotes("Auto-created for approved leave: " + leave.getLeaveType().getDisplayName())
                            .createdAt(LocalDateTime.now())
                            .createdBy("SYSTEM")
                            .isDeleted(false)
                            .build();

                    attendanceRepository.save(attendance);
                }
            }
            current = current.plusDays(1);
        }
    }

    private void deleteLeaveAttendanceRecords(Leave leave) {
        String tenantId = getTenantId();
        LocalDate current = leave.getStartDate();

        while (!current.isAfter(leave.getEndDate())) {
            attendanceRepository.findByUserIdAndAttendanceDateAndTenantIdAndIsDeletedFalse(
                    leave.getUserId(), current, tenantId
            ).ifPresent(attendance -> {
                if (attendance.getLeaveId() != null && attendance.getLeaveId().equals(leave.getLeaveId())) {
                    attendance.setIsDeleted(true);
                    attendance.setDeletedAt(LocalDateTime.now());
                    attendance.setDeletedBy("SYSTEM");
                    attendanceRepository.save(attendance);
                }
            });
            current = current.plusDays(1);
        }
    }

    private LeaveResponse mapToResponse(Leave leave) {
        return LeaveResponse.builder()
                .id(leave.getId())
                .leaveId(leave.getLeaveId())
                .tenantId(leave.getTenantId())
                .userId(leave.getUserId())
                .userName(leave.getUserName())
                .userEmail(leave.getUserEmail())
                .leaveType(leave.getLeaveType())
                .startDate(leave.getStartDate())
                .endDate(leave.getEndDate())
                .totalDays(leave.getTotalDays())
                .businessDays(leave.getBusinessDays())
                .isHalfDay(leave.getIsHalfDay())
                .halfDayType(leave.getHalfDayType())
                .reason(leave.getReason())
                .attachments(leave.getAttachments())
                .status(leave.getStatus())
                .approverId(leave.getApproverId())
                .approverName(leave.getApproverName())
                .approvedAt(leave.getApprovedAt())
                .approvalNotes(leave.getApprovalNotes())
                .rejectionReason(leave.getRejectionReason())
                .isCancelled(leave.getIsCancelled())
                .cancelledAt(leave.getCancelledAt())
                .cancelledBy(leave.getCancelledBy())
                .cancellationReason(leave.getCancellationReason())
                .isEmergencyLeave(leave.getIsEmergencyLeave())
                .emergencyContactNumber(leave.getEmergencyContactNumber())
                .balanceBefore(leave.getBalanceBefore())
                .balanceAfter(leave.getBalanceAfter())
                .contactNumberDuringLeave(leave.getContactNumberDuringLeave())
                .alternateEmail(leave.getAlternateEmail())
                .managerNotes(leave.getManagerNotes())
                .systemNotes(leave.getSystemNotes())
                .createdAt(leave.getCreatedAt())
                .createdBy(leave.getCreatedBy())
                .lastModifiedAt(leave.getLastModifiedAt())
                .lastModifiedBy(leave.getLastModifiedBy())
                .build();
    }

    private LeaveBalanceResponse mapToBalanceResponse(LeaveBalance balance) {
        Map<LeaveType, LeaveBalanceResponse.LeaveTypeBalanceDto> balanceDtos = new HashMap<>();

        balance.getBalances().forEach((type, typeBalance) -> {
            balanceDtos.put(type, LeaveBalanceResponse.LeaveTypeBalanceDto.builder()
                    .total(typeBalance.getTotal())
                    .used(typeBalance.getUsed())
                    .pending(typeBalance.getPending())
                    .available(typeBalance.getAvailable())
                    .isCarryForward(typeBalance.getIsCarryForward())
                    .carriedForward(typeBalance.getCarriedForward())
                    .lastUpdated(typeBalance.getLastUpdated())
                    .build());
        });

        return LeaveBalanceResponse.builder()
                .id(balance.getId())
                .tenantId(balance.getTenantId())
                .userId(balance.getUserId())
                .userName(balance.getUserName())
                .year(balance.getYear())
                .balances(balanceDtos)
                .createdAt(balance.getCreatedAt())
                .lastModifiedAt(balance.getLastModifiedAt())
                .build();
    }
}
