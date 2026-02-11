package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.UserActivity;
import com.ultron.backend.domain.entity.UserActivity.ActionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserActivityRepository extends MongoRepository<UserActivity, String> {

    // ===== MULTI-TENANT SAFE METHODS =====

    /**
     * Find activity by activityId and tenantId
     * MULTI-TENANT SAFE
     */
    Optional<UserActivity> findByActivityIdAndTenantId(String activityId, String tenantId);

    /**
     * Find all activities for a tenant
     * MULTI-TENANT SAFE
     */
    List<UserActivity> findByTenantIdOrderByTimestampDesc(String tenantId);
    Page<UserActivity> findByTenantIdOrderByTimestampDesc(String tenantId, Pageable pageable);

    /**
     * Find activities by user within tenant
     * MULTI-TENANT SAFE
     */
    List<UserActivity> findByUserIdAndTenantIdOrderByTimestampDesc(String userId, String tenantId);
    Page<UserActivity> findByUserIdAndTenantIdOrderByTimestampDesc(String userId, String tenantId, Pageable pageable);

    /**
     * Find activities by action type within tenant
     * MULTI-TENANT SAFE
     */
    List<UserActivity> findByActionTypeAndTenantIdOrderByTimestampDesc(ActionType actionType, String tenantId);
    Page<UserActivity> findByActionTypeAndTenantIdOrderByTimestampDesc(ActionType actionType, String tenantId, Pageable pageable);

    /**
     * Find activities by entity type within tenant
     * MULTI-TENANT SAFE
     */
    List<UserActivity> findByEntityTypeAndTenantIdOrderByTimestampDesc(String entityType, String tenantId);
    Page<UserActivity> findByEntityTypeAndTenantIdOrderByTimestampDesc(String entityType, String tenantId, Pageable pageable);

    /**
     * Find activities by entity within tenant
     * MULTI-TENANT SAFE
     */
    List<UserActivity> findByEntityTypeAndEntityIdAndTenantIdOrderByTimestampDesc(String entityType, String entityId, String tenantId);
    Page<UserActivity> findByEntityTypeAndEntityIdAndTenantIdOrderByTimestampDesc(String entityType, String entityId, String tenantId, Pageable pageable);

    /**
     * Find activities by time range within tenant
     * MULTI-TENANT SAFE
     */
    List<UserActivity> findByTimestampBetweenAndTenantIdOrderByTimestampDesc(LocalDateTime start, LocalDateTime end, String tenantId);
    Page<UserActivity> findByTimestampBetweenAndTenantIdOrderByTimestampDesc(LocalDateTime start, LocalDateTime end, String tenantId, Pageable pageable);

    /**
     * Find activities by user and action type within tenant
     * MULTI-TENANT SAFE
     */
    List<UserActivity> findByUserIdAndActionTypeAndTenantIdOrderByTimestampDesc(String userId, ActionType actionType, String tenantId);
    Page<UserActivity> findByUserIdAndActionTypeAndTenantIdOrderByTimestampDesc(String userId, ActionType actionType, String tenantId, Pageable pageable);

    /**
     * Find activities by user and entity type within tenant
     * MULTI-TENANT SAFE
     */
    List<UserActivity> findByUserIdAndEntityTypeAndTenantIdOrderByTimestampDesc(String userId, String entityType, String tenantId);
    Page<UserActivity> findByUserIdAndEntityTypeAndTenantIdOrderByTimestampDesc(String userId, String entityType, String tenantId, Pageable pageable);

    /**
     * Find activities by user and time range within tenant
     * MULTI-TENANT SAFE
     */
    List<UserActivity> findByUserIdAndTimestampBetweenAndTenantIdOrderByTimestampDesc(String userId, LocalDateTime start, LocalDateTime end, String tenantId);
    Page<UserActivity> findByUserIdAndTimestampBetweenAndTenantIdOrderByTimestampDesc(String userId, LocalDateTime start, LocalDateTime end, String tenantId, Pageable pageable);

    /**
     * Find activities by action type and entity type within tenant
     * MULTI-TENANT SAFE
     */
    List<UserActivity> findByActionTypeAndEntityTypeAndTenantIdOrderByTimestampDesc(ActionType actionType, String entityType, String tenantId);
    Page<UserActivity> findByActionTypeAndEntityTypeAndTenantIdOrderByTimestampDesc(ActionType actionType, String entityType, String tenantId, Pageable pageable);

    /**
     * Count activities by user within tenant
     * MULTI-TENANT SAFE
     */
    long countByUserIdAndTenantId(String userId, String tenantId);

    /**
     * Count activities by action type within tenant
     * MULTI-TENANT SAFE
     */
    long countByActionTypeAndTenantId(ActionType actionType, String tenantId);

    /**
     * Count activities by entity type within tenant
     * MULTI-TENANT SAFE
     */
    long countByEntityTypeAndTenantId(String entityType, String tenantId);

    /**
     * Count activities by user and time range within tenant
     * MULTI-TENANT SAFE
     */
    long countByUserIdAndTimestampBetweenAndTenantId(String userId, LocalDateTime start, LocalDateTime end, String tenantId);

    /**
     * Count activities by time range within tenant
     * MULTI-TENANT SAFE
     */
    long countByTimestampBetweenAndTenantId(LocalDateTime start, LocalDateTime end, String tenantId);

    /**
     * Count all activities within tenant
     * MULTI-TENANT SAFE
     */
    long countByTenantId(String tenantId);

    /**
     * Get latest activity for tenant (for ID generation)
     * MULTI-TENANT SAFE
     */
    Optional<UserActivity> findFirstByTenantIdOrderByCreatedAtDesc(String tenantId);

    // ===== DANGEROUS METHODS - ADMIN ONLY =====
    // ⚠️ These methods query across ALL tenants
    // Use with EXTREME caution - only for admin/migration purposes

    /**
     * ⚠️ ADMIN ONLY - Find by business ID across ALL tenants
     * Use with EXTREME caution
     */
    Optional<UserActivity> findByActivityId(String activityId);

    /**
     * ⚠️ ADMIN ONLY - Find by user across ALL tenants
     * Use with EXTREME caution
     */
    List<UserActivity> findByUserIdOrderByTimestampDesc(String userId);
    Page<UserActivity> findByUserIdOrderByTimestampDesc(String userId, Pageable pageable);

    /**
     * ⚠️ ADMIN ONLY - Find by action type across ALL tenants
     * Use with EXTREME caution
     */
    List<UserActivity> findByActionTypeOrderByTimestampDesc(ActionType actionType);
    Page<UserActivity> findByActionTypeOrderByTimestampDesc(ActionType actionType, Pageable pageable);

    /**
     * ⚠️ ADMIN ONLY - Find by entity type across ALL tenants
     * Use with EXTREME caution
     */
    List<UserActivity> findByEntityTypeOrderByTimestampDesc(String entityType);
    Page<UserActivity> findByEntityTypeOrderByTimestampDesc(String entityType, Pageable pageable);

    /**
     * ⚠️ ADMIN ONLY - Find by entity across ALL tenants
     * Use with EXTREME caution
     */
    List<UserActivity> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, String entityId);
    Page<UserActivity> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, String entityId, Pageable pageable);

    /**
     * ⚠️ ADMIN ONLY - Find by time range across ALL tenants
     * Use with EXTREME caution
     */
    List<UserActivity> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime start, LocalDateTime end);
    Page<UserActivity> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime start, LocalDateTime end, Pageable pageable);

    /**
     * ⚠️ ADMIN ONLY - Combined queries across ALL tenants
     * Use with EXTREME caution
     */
    List<UserActivity> findByUserIdAndActionTypeOrderByTimestampDesc(String userId, ActionType actionType);
    Page<UserActivity> findByUserIdAndActionTypeOrderByTimestampDesc(String userId, ActionType actionType, Pageable pageable);

    List<UserActivity> findByUserIdAndEntityTypeOrderByTimestampDesc(String userId, String entityType);
    Page<UserActivity> findByUserIdAndEntityTypeOrderByTimestampDesc(String userId, String entityType, Pageable pageable);

    List<UserActivity> findByUserIdAndTimestampBetweenOrderByTimestampDesc(String userId, LocalDateTime start, LocalDateTime end);
    Page<UserActivity> findByUserIdAndTimestampBetweenOrderByTimestampDesc(String userId, LocalDateTime start, LocalDateTime end, Pageable pageable);

    List<UserActivity> findByActionTypeAndEntityTypeOrderByTimestampDesc(ActionType actionType, String entityType);
    Page<UserActivity> findByActionTypeAndEntityTypeOrderByTimestampDesc(ActionType actionType, String entityType, Pageable pageable);

    /**
     * ⚠️ ADMIN ONLY - All activities with pagination across ALL tenants
     * Use with EXTREME caution
     */
    Page<UserActivity> findAllByOrderByTimestampDesc(Pageable pageable);

    /**
     * ⚠️ ADMIN ONLY - Count queries across ALL tenants
     * Use with EXTREME caution
     */
    long countByUserId(String userId);
    long countByActionType(ActionType actionType);
    long countByEntityType(String entityType);
    long countByUserIdAndTimestampBetween(String userId, LocalDateTime start, LocalDateTime end);
    long countByTimestampBetween(LocalDateTime start, LocalDateTime end);

    /**
     * ⚠️ ADMIN ONLY - Get latest activity across ALL tenants
     * Use ONLY for global ID generation
     */
    Optional<UserActivity> findFirstByOrderByTimestampDesc();
}
