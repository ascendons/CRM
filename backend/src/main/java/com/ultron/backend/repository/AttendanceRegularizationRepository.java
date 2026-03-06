package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.AttendanceRegularization;
import com.ultron.backend.domain.enums.RegularizationStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository for AttendanceRegularization entity with tenant-aware queries
 */
@Repository
public interface AttendanceRegularizationRepository extends MongoRepository<AttendanceRegularization, String> {

    // Find by ID
    Optional<AttendanceRegularization> findByRegularizationIdAndTenantId(
            String regularizationId, String tenantId);

    Optional<AttendanceRegularization> findByIdAndTenantIdAndIsDeletedFalse(
            String id, String tenantId);

    // Find by attendance ID
    List<AttendanceRegularization> findByAttendanceIdAndTenantIdAndIsDeletedFalse(
            String attendanceId, String tenantId);

    // User's regularizations
    List<AttendanceRegularization> findByUserIdAndTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(
            String userId, String tenantId);

    List<AttendanceRegularization> findByUserIdAndTenantIdAndStatusAndIsDeletedFalse(
            String userId, String tenantId, RegularizationStatus status);

    // Pending approvals for manager
    List<AttendanceRegularization> findByApproverIdAndTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(
            String approverId, String tenantId, RegularizationStatus status);

    // All pending (admin)
    List<AttendanceRegularization> findByTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(
            String tenantId, RegularizationStatus status);

    // Date range
    List<AttendanceRegularization> findByTenantIdAndAttendanceDateBetweenAndIsDeletedFalse(
            String tenantId, LocalDate startDate, LocalDate endDate);

    // Count queries
    long countByUserIdAndTenantIdAndStatusAndIsDeletedFalse(
            String userId, String tenantId, RegularizationStatus status);
}
