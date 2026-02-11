package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Activity;
import com.ultron.backend.domain.enums.ActivityType;
import com.ultron.backend.domain.enums.ActivityStatus;
import com.ultron.backend.domain.enums.ActivityPriority;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ActivityRepository extends MongoRepository<Activity, String> {

    // ===== MULTI-TENANT SAFE METHODS =====

    /**
     * Find activity by activityId and tenantId
     * MULTI-TENANT SAFE
     */
    Optional<Activity> findByActivityIdAndTenantId(String activityId, String tenantId);

    /**
     * Find all activities for a tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<Activity> findByTenantIdAndIsDeletedFalse(String tenantId);

    /**
     * Find activities by type within tenant
     * MULTI-TENANT SAFE
     */
    List<Activity> findByTypeAndTenantIdAndIsDeletedFalse(ActivityType type, String tenantId);

    /**
     * Find activities by status within tenant
     * MULTI-TENANT SAFE
     */
    List<Activity> findByStatusAndTenantIdAndIsDeletedFalse(ActivityStatus status, String tenantId);

    /**
     * Find activities by priority within tenant
     * MULTI-TENANT SAFE
     */
    List<Activity> findByPriorityAndTenantIdAndIsDeletedFalse(ActivityPriority priority, String tenantId);

    /**
     * Find activities by lead within tenant
     * MULTI-TENANT SAFE
     */
    List<Activity> findByLeadIdAndTenantIdAndIsDeletedFalse(String leadId, String tenantId);

    /**
     * Find activities by contact within tenant
     * MULTI-TENANT SAFE
     */
    List<Activity> findByContactIdAndTenantIdAndIsDeletedFalse(String contactId, String tenantId);

    /**
     * Find activities by account within tenant
     * MULTI-TENANT SAFE
     */
    List<Activity> findByAccountIdAndTenantIdAndIsDeletedFalse(String accountId, String tenantId);

    /**
     * Find activities by opportunity within tenant
     * MULTI-TENANT SAFE
     */
    List<Activity> findByOpportunityIdAndTenantIdAndIsDeletedFalse(String opportunityId, String tenantId);

    /**
     * Find activities by assigned user within tenant
     * MULTI-TENANT SAFE
     */
    List<Activity> findByAssignedToIdAndTenantIdAndIsDeletedFalse(String assignedToId, String tenantId);

    /**
     * Find active activities within tenant
     * MULTI-TENANT SAFE
     */
    @Query("{ 'tenantId': ?0, 'isDeleted': false, 'status': { $in: ['PENDING', 'IN_PROGRESS'] } }")
    List<Activity> findActiveActivitiesByTenantId(String tenantId);

    /**
     * Find completed activities within tenant
     * MULTI-TENANT SAFE
     */
    @Query("{ 'tenantId': ?0, 'isDeleted': false, 'status': 'COMPLETED' }")
    List<Activity> findCompletedActivitiesByTenantId(String tenantId);

    /**
     * Find overdue activities within tenant
     * MULTI-TENANT SAFE
     */
    @Query("{ 'tenantId': ?1, 'isDeleted': false, 'dueDate': { $lt: ?0 }, 'status': { $in: ['PENDING', 'IN_PROGRESS'] } }")
    List<Activity> findOverdueActivitiesByTenantId(LocalDateTime now, String tenantId);

    /**
     * Find activities by date range within tenant
     * MULTI-TENANT SAFE
     */
    @Query("{ 'tenantId': ?2, 'isDeleted': false, 'scheduledDate': { $gte: ?0, $lte: ?1 } }")
    List<Activity> findActivitiesByDateRangeAndTenantId(LocalDateTime startDate, LocalDateTime endDate, String tenantId);

    /**
     * Search activities within tenant
     * MULTI-TENANT SAFE
     */
    @Query("{ 'tenantId': ?1, 'isDeleted': false, '$or': [ " +
            "{ 'subject': { $regex: ?0, $options: 'i' } }, " +
            "{ 'description': { $regex: ?0, $options: 'i' } }, " +
            "{ 'leadName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'contactName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'accountName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'opportunityName': { $regex: ?0, $options: 'i' } } ] }")
    List<Activity> searchActivitiesByTenantId(String searchTerm, String tenantId);

    /**
     * Count activities within tenant
     * MULTI-TENANT SAFE
     */
    long countByTenantIdAndIsDeletedFalse(String tenantId);

    /**
     * Count activities by type within tenant
     * MULTI-TENANT SAFE
     */
    long countByTypeAndTenantIdAndIsDeletedFalse(ActivityType type, String tenantId);

    /**
     * Count activities by status within tenant
     * MULTI-TENANT SAFE
     */
    long countByStatusAndTenantIdAndIsDeletedFalse(ActivityStatus status, String tenantId);

    /**
     * Count activities by priority within tenant
     * MULTI-TENANT SAFE
     */
    long countByPriorityAndTenantIdAndIsDeletedFalse(ActivityPriority priority, String tenantId);

    /**
     * Get latest activity for tenant (for ID generation)
     * MULTI-TENANT SAFE
     */
    Optional<Activity> findFirstByTenantIdOrderByCreatedAtDesc(String tenantId);

    // ===== DANGEROUS METHODS - ADMIN ONLY =====
    // ⚠️ These methods query across ALL tenants
    // Use with EXTREME caution - only for admin/migration purposes

    /**
     * ⚠️ ADMIN ONLY - Find activity by activityId across ALL tenants
     * Use with EXTREME caution
     */
    Optional<Activity> findByActivityId(String activityId);

    /**
     * ⚠️ ADMIN ONLY - Get all activities across ALL tenants
     * Use with EXTREME caution
     */
    List<Activity> findByIsDeletedFalse();

    /**
     * ⚠️ ADMIN ONLY - Find by type across ALL tenants
     * Use with EXTREME caution
     */
    List<Activity> findByTypeAndIsDeletedFalse(ActivityType type);

    /**
     * ⚠️ ADMIN ONLY - Find by status across ALL tenants
     * Use with EXTREME caution
     */
    List<Activity> findByStatusAndIsDeletedFalse(ActivityStatus status);

    /**
     * ⚠️ ADMIN ONLY - Find by priority across ALL tenants
     * Use with EXTREME caution
     */
    List<Activity> findByPriorityAndIsDeletedFalse(ActivityPriority priority);

    /**
     * ⚠️ ADMIN ONLY - Find by lead across ALL tenants
     * Use with EXTREME caution
     */
    List<Activity> findByLeadIdAndIsDeletedFalse(String leadId);

    /**
     * ⚠️ ADMIN ONLY - Find by contact across ALL tenants
     * Use with EXTREME caution
     */
    List<Activity> findByContactIdAndIsDeletedFalse(String contactId);

    /**
     * ⚠️ ADMIN ONLY - Find by account across ALL tenants
     * Use with EXTREME caution
     */
    List<Activity> findByAccountIdAndIsDeletedFalse(String accountId);

    /**
     * ⚠️ ADMIN ONLY - Find by opportunity across ALL tenants
     * Use with EXTREME caution
     */
    List<Activity> findByOpportunityIdAndIsDeletedFalse(String opportunityId);

    /**
     * ⚠️ ADMIN ONLY - Find by assigned user across ALL tenants
     * Use with EXTREME caution
     */
    List<Activity> findByAssignedToIdAndIsDeletedFalse(String assignedToId);

    /**
     * ⚠️ ADMIN ONLY - Find active activities across ALL tenants
     * Use with EXTREME caution
     */
    @Query("{ 'isDeleted': false, 'status': { $in: ['PENDING', 'IN_PROGRESS'] } }")
    List<Activity> findActiveActivities();

    /**
     * ⚠️ ADMIN ONLY - Find completed activities across ALL tenants
     * Use with EXTREME caution
     */
    @Query("{ 'isDeleted': false, 'status': 'COMPLETED' }")
    List<Activity> findCompletedActivities();

    /**
     * ⚠️ ADMIN ONLY - Find overdue activities across ALL tenants
     * Use with EXTREME caution
     */
    @Query("{ 'isDeleted': false, 'dueDate': { $lt: ?0 }, 'status': { $in: ['PENDING', 'IN_PROGRESS'] } }")
    List<Activity> findOverdueActivities(LocalDateTime now);

    /**
     * ⚠️ ADMIN ONLY - Find by date range across ALL tenants
     * Use with EXTREME caution
     */
    @Query("{ 'isDeleted': false, 'scheduledDate': { $gte: ?0, $lte: ?1 } }")
    List<Activity> findActivitiesByDateRange(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * ⚠️ ADMIN ONLY - Search activities across ALL tenants
     * Use with EXTREME caution
     */
    @Query("{ 'isDeleted': false, '$or': [ " +
            "{ 'subject': { $regex: ?0, $options: 'i' } }, " +
            "{ 'description': { $regex: ?0, $options: 'i' } }, " +
            "{ 'leadName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'contactName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'accountName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'opportunityName': { $regex: ?0, $options: 'i' } } ] }")
    List<Activity> searchActivities(String searchTerm);

    /**
     * ⚠️ ADMIN ONLY - Count all activities across ALL tenants
     * Use with EXTREME caution
     */
    long countByIsDeletedFalse();

    /**
     * ⚠️ ADMIN ONLY - Count by type across ALL tenants
     * Use with EXTREME caution
     */
    long countByTypeAndIsDeletedFalse(ActivityType type);

    /**
     * ⚠️ ADMIN ONLY - Count by status across ALL tenants
     * Use with EXTREME caution
     */
    long countByStatusAndIsDeletedFalse(ActivityStatus status);

    /**
     * ⚠️ ADMIN ONLY - Get latest activity across ALL tenants
     * Use ONLY for global ID generation
     */
    Optional<Activity> findFirstByOrderByCreatedAtDesc();
}
