package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Attendance;
import com.ultron.backend.domain.enums.AttendanceStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends MongoRepository<Attendance, String> {

    /**
     * Find attendance by unique attendanceId and tenantId (ATT-YYYY-MM-XXXXX)
     * MULTI-TENANT SAFE
     */
    Optional<Attendance> findByAttendanceIdAndTenantId(String attendanceId, String tenantId);

    /**
     * Find attendance by userId and date within tenant
     * Used for checking duplicate check-ins
     * MULTI-TENANT SAFE
     */
    Optional<Attendance> findByUserIdAndAttendanceDateAndTenantId(String userId, LocalDate date, String tenantId);

    /**
     * Find attendance by userId and date within tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    Optional<Attendance> findByUserIdAndAttendanceDateAndTenantIdAndIsDeletedFalse(String userId, LocalDate date, String tenantId);

    /**
     * Find all attendance records for a user within date range (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<Attendance> findByUserIdAndTenantIdAndAttendanceDateBetweenAndIsDeletedFalse(
            String userId, String tenantId, LocalDate startDate, LocalDate endDate);

    /**
     * Find all attendance records for a specific date within tenant (excluding deleted)
     * Used for daily dashboard
     * MULTI-TENANT SAFE
     */
    List<Attendance> findByTenantIdAndAttendanceDateAndIsDeletedFalse(String tenantId, LocalDate date);

    /**
     * Find attendance records by status and date range within tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<Attendance> findByTenantIdAndStatusAndAttendanceDateBetweenAndIsDeletedFalse(
            String tenantId, AttendanceStatus status, LocalDate startDate, LocalDate endDate);

    /**
     * Find attendance records by status within tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<Attendance> findByTenantIdAndStatusAndIsDeletedFalse(String tenantId, AttendanceStatus status);

    /**
     * Count attendance by userId, status and date range within tenant (excluding deleted)
     * Used for monthly reports
     * MULTI-TENANT SAFE
     */
    long countByUserIdAndTenantIdAndStatusAndAttendanceDateBetweenAndIsDeletedFalse(
            String userId, String tenantId, AttendanceStatus status, LocalDate startDate, LocalDate endDate);

    /**
     * Count attendance by status and date within tenant (excluding deleted)
     * Used for dashboard statistics
     * MULTI-TENANT SAFE
     */
    long countByTenantIdAndStatusAndAttendanceDateAndIsDeletedFalse(
            String tenantId, AttendanceStatus status, LocalDate date);

    /**
     * Find attendance records with no checkout (checkout time is null) for a specific date
     * Used for missed checkout notifications
     * MULTI-TENANT SAFE
     */
    List<Attendance> findByTenantIdAndAttendanceDateAndCheckOutTimeIsNullAndIsDeletedFalse(
            String tenantId, LocalDate date);

    /**
     * Find attendance records requiring approval within tenant
     * MULTI-TENANT SAFE
     */
    List<Attendance> findByTenantIdAndRequiresApprovalTrueAndIsDeletedFalse(String tenantId);

    /**
     * Find attendance records for a user ordered by date descending (for history)
     * MULTI-TENANT SAFE
     */
    List<Attendance> findByUserIdAndTenantIdAndIsDeletedFalseOrderByAttendanceDateDesc(String userId, String tenantId);

    /**
     * Search attendance records by user name within tenant (for admin search)
     * MULTI-TENANT SAFE
     */
    @Query("{ 'tenantId': ?1, 'userName': { $regex: ?0, $options: 'i' }, 'isDeleted': false }")
    List<Attendance> searchAttendanceByUserName(String searchTerm, String tenantId);

    /**
     * Find latest attendance for a user (for validation and history)
     * MULTI-TENANT SAFE
     */
    Optional<Attendance> findFirstByUserIdAndTenantIdAndIsDeletedFalseOrderByAttendanceDateDescCheckInTimeDesc(
            String userId, String tenantId);

    /**
     * Count total attendance records for tenant
     * MULTI-TENANT SAFE
     */
    long countByTenantIdAndIsDeletedFalse(String tenantId);

    // ===== DANGEROUS METHODS - DO NOT USE IN BUSINESS LOGIC =====
    // These methods are ONLY for admin/migration purposes

    /**
     * ⚠️ ADMIN ONLY - Find attendance by attendanceId across ALL tenants
     * Use with EXTREME caution
     */
    Optional<Attendance> findByAttendanceId(String attendanceId);

    /**
     * ⚠️ ADMIN ONLY - Get latest attendance across ALL tenants
     * Use ONLY for global ID generation
     */
    Optional<Attendance> findFirstByOrderByCreatedAtDesc();
}
