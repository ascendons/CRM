package com.ultron.backend.service;

import com.ultron.backend.domain.entity.OfficeLocation;
import com.ultron.backend.domain.entity.Shift;
import com.ultron.backend.domain.entity.User;
import com.ultron.backend.domain.entity.UserShiftAssignment;
import com.ultron.backend.dto.shift.BulkAssignmentResult;
import com.ultron.backend.dto.shift.BulkShiftAssignmentRequest;
import com.ultron.backend.dto.shift.ShiftAssignmentResponse;
import com.ultron.backend.repository.OfficeLocationRepository;
import com.ultron.backend.repository.ShiftRepository;
import com.ultron.backend.repository.UserRepository;
import com.ultron.backend.repository.UserShiftAssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Service for bulk shift assignment operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BulkShiftAssignmentService extends BaseTenantService {

    private final UserShiftAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final ShiftRepository shiftRepository;
    private final OfficeLocationRepository officeLocationRepository;

    /**
     * Bulk assign shift to multiple users
     */
    @Transactional
    public BulkAssignmentResult bulkAssignShift(BulkShiftAssignmentRequest request, String assignedBy) {
        String tenantId = getCurrentTenantId();
        log.info("Bulk assigning shift {} to {} users", request.getShiftId(), request.getUserIds().size());

        // Validate shift exists
        Shift shift = shiftRepository.findByShiftIdAndTenantId(request.getShiftId(), tenantId)
                .orElseThrow(() -> new RuntimeException("Shift not found"));

        // Validate office location if provided
        OfficeLocation officeLocation = null;
        if (request.getOfficeLocationId() != null) {
            officeLocation = officeLocationRepository
                    .findByLocationIdAndTenantId(request.getOfficeLocationId(), tenantId)
                    .orElseThrow(() -> new RuntimeException("Office location not found"));
        }

        List<ShiftAssignmentResponse> successful = new ArrayList<>();
        List<BulkAssignmentResult.FailedAssignment> failed = new ArrayList<>();

        for (String userId : request.getUserIds()) {
            try {
                // Get user
                Optional<User> userOpt = userRepository.findByIdAndTenantId(userId, tenantId);
                if (userOpt.isEmpty()) {
                    failed.add(BulkAssignmentResult.FailedAssignment.builder()
                            .userId(userId)
                            .userName("Unknown")
                            .reason("User not found")
                            .build());
                    continue;
                }

                User user = userOpt.get();
                String userName = user.getFullName() != null ? user.getFullName() :
                    (user.getProfile() != null && user.getProfile().getFullName() != null) ?
                    user.getProfile().getFullName() : user.getUsername();

                // Create assignment
                UserShiftAssignment assignment = UserShiftAssignment.builder()
                        .tenantId(tenantId)
                        .userId(userId)
                        .userName(userName)
                        .shiftId(shift.getShiftId())
                        .shiftName(shift.getName())
                        .officeLocationId(officeLocation != null ? officeLocation.getLocationId() : null)
                        .officeLocationName(officeLocation != null ? officeLocation.getName() : null)
                        .effectiveDate(request.getEffectiveDate())
                        .endDate(request.getEndDate())
                        .isTemporary(request.getIsTemporary() != null && request.getIsTemporary())
                        .reason(request.getReason())
                        .createdAt(LocalDateTime.now())
                        .createdBy(assignedBy)
                        .build();

                assignmentRepository.save(assignment);

                successful.add(ShiftAssignmentResponse.builder()
                        .id(assignment.getId())
                        .tenantId(assignment.getTenantId())
                        .userId(assignment.getUserId())
                        .userName(assignment.getUserName())
                        .shiftId(assignment.getShiftId())
                        .shiftName(assignment.getShiftName())
                        .officeLocationId(assignment.getOfficeLocationId())
                        .officeLocationName(assignment.getOfficeLocationName())
                        .effectiveDate(assignment.getEffectiveDate())
                        .endDate(assignment.getEndDate())
                        .isTemporary(assignment.getIsTemporary())
                        .reason(assignment.getReason())
                        .build());

                log.info("Assigned shift {} to user {}", shift.getName(), userName);

            } catch (Exception e) {
                log.error("Failed to assign shift to user {}: {}", userId, e.getMessage());
                failed.add(BulkAssignmentResult.FailedAssignment.builder()
                        .userId(userId)
                        .userName("Unknown")
                        .reason(e.getMessage())
                        .build());
            }
        }

        log.info("Bulk assignment completed: {} successful, {} failed",
                successful.size(), failed.size());

        return BulkAssignmentResult.builder()
                .totalRequested(request.getUserIds().size())
                .successCount(successful.size())
                .failureCount(failed.size())
                .successful(successful)
                .failed(failed)
                .build();
    }

    /**
     * Get user's active shift assignment
     */
    public ShiftAssignmentResponse getUserActiveAssignment(String userId) {
        String tenantId = getCurrentTenantId();

        List<UserShiftAssignment> assignments = assignmentRepository
                .findByTenantIdAndUserIdOrderByEffectiveDateDesc(tenantId, userId);

        if (assignments.isEmpty()) {
            return null;
        }

        // Get the most recent active assignment
        UserShiftAssignment active = assignments.stream()
                .filter(a -> !a.getEffectiveDate().isAfter(java.time.LocalDate.now()))
                .filter(a -> a.getEndDate() == null || !a.getEndDate().isBefore(java.time.LocalDate.now()))
                .findFirst()
                .orElse(null);

        if (active == null) {
            return null;
        }

        return mapToResponse(active);
    }

    /**
     * Get all assignments for a user
     */
    public List<ShiftAssignmentResponse> getUserAssignments(String userId) {
        String tenantId = getCurrentTenantId();

        List<UserShiftAssignment> assignments = assignmentRepository
                .findByTenantIdAndUserIdOrderByEffectiveDateDesc(tenantId, userId);

        return assignments.stream().map(this::mapToResponse).toList();
    }

    private ShiftAssignmentResponse mapToResponse(UserShiftAssignment assignment) {
        return ShiftAssignmentResponse.builder()
                .id(assignment.getId())
                .tenantId(assignment.getTenantId())
                .userId(assignment.getUserId())
                .userName(assignment.getUserName())
                .shiftId(assignment.getShiftId())
                .shiftName(assignment.getShiftName())
                .officeLocationId(assignment.getOfficeLocationId())
                .officeLocationName(assignment.getOfficeLocationName())
                .effectiveDate(assignment.getEffectiveDate())
                .endDate(assignment.getEndDate())
                .isTemporary(assignment.getIsTemporary())
                .reason(assignment.getReason())
                .build();
    }
}
