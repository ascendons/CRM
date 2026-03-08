package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Leave;
import com.ultron.backend.domain.enums.LeaveStatus;
import com.ultron.backend.domain.enums.LeaveType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository for Leave entity with tenant-aware queries
 */
@Repository
public interface LeaveRepository extends MongoRepository<Leave, String> {

    // Find by ID
    Optional<Leave> findByLeaveIdAndTenantId(String leaveId, String tenantId);

    Optional<Leave> findByIdAndTenantIdAndIsDeletedFalse(String id, String tenantId);

    // User's leaves
    List<Leave> findByUserIdAndTenantIdAndIsDeletedFalseOrderByStartDateDesc(
            String userId, String tenantId);

    // Team leaves (for multiple users)
    List<Leave> findByUserIdInAndTenantIdAndIsDeletedFalseOrderByStartDateDesc(
            List<String> userIds, String tenantId);

    List<Leave> findByUserIdAndTenantIdAndStatusAndIsDeletedFalse(
            String userId, String tenantId, LeaveStatus status);

    List<Leave> findByUserIdAndTenantIdAndStatusInAndIsDeletedFalseOrderByStartDateDesc(
            String userId, String tenantId, List<LeaveStatus> statuses);

    // Date range queries
    List<Leave> findByUserIdAndTenantIdAndStartDateBetweenAndIsDeletedFalse(
            String userId, String tenantId, LocalDate startDate, LocalDate endDate);

    List<Leave> findByTenantIdAndStartDateBetweenAndIsDeletedFalseOrderByStartDateDesc(
            String tenantId, LocalDate startDate, LocalDate endDate);

    // Check overlapping leaves
    List<Leave> findByUserIdAndTenantIdAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqualAndIsDeletedFalse(
            String userId, String tenantId, List<LeaveStatus> statuses,
            LocalDate endDate, LocalDate startDate);

    // Pending approvals for manager
    List<Leave> findByApproverIdAndTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(
            String approverId, String tenantId, LeaveStatus status);

    // All pending approvals for admin
    List<Leave> findByTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(
            String tenantId, LeaveStatus status);

    // Count queries
    long countByUserIdAndTenantIdAndStatusAndIsDeletedFalse(
            String userId, String tenantId, LeaveStatus status);

    long countByUserIdAndTenantIdAndLeaveTypeAndStatusAndStartDateBetweenAndIsDeletedFalse(
            String userId, String tenantId, LeaveType leaveType, LeaveStatus status,
            LocalDate startDate, LocalDate endDate);

    // Statistics
    List<Leave> findByTenantIdAndStatusAndStartDateBetweenAndIsDeletedFalse(
            String tenantId, LeaveStatus status, LocalDate startDate, LocalDate endDate);

    List<Leave> findByUserIdAndTenantIdAndLeaveTypeAndStatusInAndStartDateBetweenAndIsDeletedFalse(
            String userId, String tenantId, LeaveType leaveType, List<LeaveStatus> statuses,
            LocalDate startDate, LocalDate endDate);

    // Emergency leaves
    List<Leave> findByTenantIdAndIsEmergencyLeaveAndCreatedAtBetweenAndIsDeletedFalse(
            String tenantId, Boolean isEmergencyLeave, LocalDate startDate, LocalDate endDate);

    // Check if user has leave on specific date
    Optional<Leave> findByUserIdAndTenantIdAndStartDateLessThanEqualAndEndDateGreaterThanEqualAndStatusAndIsDeletedFalse(
            String userId, String tenantId, LocalDate date1, LocalDate date2, LeaveStatus status);
}
