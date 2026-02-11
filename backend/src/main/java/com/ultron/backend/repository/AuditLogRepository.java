package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {

    // ===== MULTI-TENANT SAFE METHODS =====

    /**
     * Find audit log by id and tenantId
     * MULTI-TENANT SAFE
     */
    Optional<AuditLog> findByIdAndTenantId(String id, String tenantId);

    /**
     * Find all audit logs for a tenant
     * MULTI-TENANT SAFE
     */
    List<AuditLog> findByTenantIdOrderByTimestampDesc(String tenantId);
    Page<AuditLog> findByTenantIdOrderByTimestampDesc(String tenantId, Pageable pageable);

    /**
     * Find by entity within tenant
     * MULTI-TENANT SAFE
     */
    List<AuditLog> findByEntityTypeAndEntityIdAndTenantIdOrderByTimestampDesc(String entityType, String entityId, String tenantId);
    Page<AuditLog> findByEntityTypeAndEntityIdAndTenantIdOrderByTimestampDesc(String entityType, String entityId, String tenantId, Pageable pageable);

    /**
     * Find by user within tenant
     * MULTI-TENANT SAFE
     */
    List<AuditLog> findByUserIdAndTenantIdOrderByTimestampDesc(String userId, String tenantId);
    Page<AuditLog> findByUserIdAndTenantIdOrderByTimestampDesc(String userId, String tenantId, Pageable pageable);

    /**
     * Find by entity type within tenant
     * MULTI-TENANT SAFE
     */
    List<AuditLog> findByEntityTypeAndTenantIdOrderByTimestampDesc(String entityType, String tenantId);
    Page<AuditLog> findByEntityTypeAndTenantIdOrderByTimestampDesc(String entityType, String tenantId, Pageable pageable);

    /**
     * Find by action within tenant
     * MULTI-TENANT SAFE
     */
    List<AuditLog> findByActionAndTenantIdOrderByTimestampDesc(String action, String tenantId);
    Page<AuditLog> findByActionAndTenantIdOrderByTimestampDesc(String action, String tenantId, Pageable pageable);

    /**
     * Find by time range within tenant
     * MULTI-TENANT SAFE
     */
    List<AuditLog> findByTimestampBetweenAndTenantIdOrderByTimestampDesc(LocalDateTime start, LocalDateTime end, String tenantId);
    Page<AuditLog> findByTimestampBetweenAndTenantIdOrderByTimestampDesc(LocalDateTime start, LocalDateTime end, String tenantId, Pageable pageable);

    /**
     * Combined queries within tenant
     * MULTI-TENANT SAFE
     */
    List<AuditLog> findByEntityTypeAndActionAndTenantIdOrderByTimestampDesc(String entityType, String action, String tenantId);
    List<AuditLog> findByUserIdAndEntityTypeAndTenantIdOrderByTimestampDesc(String userId, String entityType, String tenantId);

    /**
     * Count audit logs within tenant
     * MULTI-TENANT SAFE
     */
    long countByTenantId(String tenantId);

    /**
     * Count by entity type within tenant
     * MULTI-TENANT SAFE
     */
    long countByEntityTypeAndTenantId(String entityType, String tenantId);

    /**
     * Count by action within tenant
     * MULTI-TENANT SAFE
     */
    long countByActionAndTenantId(String action, String tenantId);

    // ===== DANGEROUS METHODS - ADMIN ONLY =====
    // ⚠️ These methods query across ALL tenants
    // Use with EXTREME caution - only for admin/migration purposes

    /**
     * ⚠️ ADMIN ONLY - Find by entity across ALL tenants
     * Use with EXTREME caution
     */
    List<AuditLog> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, String entityId);
    Page<AuditLog> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, String entityId, Pageable pageable);

    /**
     * ⚠️ ADMIN ONLY - Find by user across ALL tenants
     * Use with EXTREME caution
     */
    List<AuditLog> findByUserIdOrderByTimestampDesc(String userId);
    Page<AuditLog> findByUserIdOrderByTimestampDesc(String userId, Pageable pageable);

    /**
     * ⚠️ ADMIN ONLY - Find by entity type across ALL tenants
     * Use with EXTREME caution
     */
    List<AuditLog> findByEntityTypeOrderByTimestampDesc(String entityType);
    Page<AuditLog> findByEntityTypeOrderByTimestampDesc(String entityType, Pageable pageable);

    /**
     * ⚠️ ADMIN ONLY - Find by action across ALL tenants
     * Use with EXTREME caution
     */
    List<AuditLog> findByActionOrderByTimestampDesc(String action);
    Page<AuditLog> findByActionOrderByTimestampDesc(String action, Pageable pageable);

    /**
     * ⚠️ ADMIN ONLY - Find by time range across ALL tenants
     * Use with EXTREME caution
     */
    List<AuditLog> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime start, LocalDateTime end);
    Page<AuditLog> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime start, LocalDateTime end, Pageable pageable);

    /**
     * ⚠️ ADMIN ONLY - Combined queries across ALL tenants
     * Use with EXTREME caution
     */
    List<AuditLog> findByEntityTypeAndActionOrderByTimestampDesc(String entityType, String action);
    List<AuditLog> findByUserIdAndEntityTypeOrderByTimestampDesc(String userId, String entityType);

    /**
     * ⚠️ ADMIN ONLY - Count all audit logs across ALL tenants
     * Use with EXTREME caution
     */
    long count();
}
