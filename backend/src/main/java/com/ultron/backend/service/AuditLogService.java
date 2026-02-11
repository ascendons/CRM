package com.ultron.backend.service;

import com.ultron.backend.domain.entity.AuditLog;
import com.ultron.backend.repository.AuditLogRepository;
import com.ultron.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Service for managing audit logs with multi-tenancy support
 * Provides comprehensive audit trail functionality with tenant isolation
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService extends BaseTenantService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    /**
     * Log an audit event asynchronously
     * This method runs in a separate thread to avoid impacting main transaction performance
     * MULTI-TENANT SAFE - automatically uses current tenant context
     */
    @Async
    public void logAsync(String entityType, String entityId, String entityName,
                         String action, String description,
                         String oldValue, String newValue,
                         String userId, Map<String, Object> metadata) {
        log(entityType, entityId, entityName, action, description, oldValue, newValue, userId, metadata);
    }

    /**
     * Log an audit event synchronously
     * MULTI-TENANT SAFE - automatically sets tenantId from context
     */
    public AuditLog log(String entityType, String entityId, String entityName,
                        String action, String description,
                        String oldValue, String newValue,
                        String userId, Map<String, Object> metadata) {

        // Get current tenant ID for multi-tenancy
        String tenantId = getCurrentTenantId();

        String userName = getUserName(userId);

        AuditLog auditLog = AuditLog.builder()
                .tenantId(tenantId)  // CRITICAL: Set tenant ID for data isolation
                .entityType(entityType)
                .entityId(entityId)
                .entityName(entityName)
                .action(action)
                .description(description)
                .oldValue(oldValue)
                .newValue(newValue)
                .userId(userId)
                .userName(userName)
                .timestamp(LocalDateTime.now())
                .metadata(metadata)
                .build();

        AuditLog saved = auditLogRepository.save(auditLog);

        log.info("[Tenant: {}] Audit log created: entityType={}, entityId={}, action={}, user={}",
                tenantId, entityType, entityId, action, userName);

        return saved;
    }

    /**
     * Convenience method for state transitions
     * MULTI-TENANT SAFE
     */
    public AuditLog logStateTransition(String entityType, String entityId, String entityName,
                                       String oldState, String newState,
                                       String userId, String reason) {

        String action = "STATE_CHANGE";
        String description = String.format("%s state changed from %s to %s", entityType, oldState, newState);

        if (reason != null && !reason.isEmpty()) {
            description += ". Reason: " + reason;
        }

        Map<String, Object> metadata = reason != null ? Map.of("reason", reason) : null;

        return log(entityType, entityId, entityName, action, description,
                  oldState, newState, userId, metadata);
    }

    /**
     * Get audit logs for a specific entity within tenant
     * MULTI-TENANT SAFE
     */
    public List<AuditLog> getEntityAuditLogs(String entityType, String entityId) {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching audit logs for entity: {}:{}", tenantId, entityType, entityId);
        return auditLogRepository.findByEntityTypeAndEntityIdAndTenantIdOrderByTimestampDesc(entityType, entityId, tenantId);
    }

    /**
     * Get audit logs for a specific entity within tenant (paginated)
     * MULTI-TENANT SAFE
     */
    public Page<AuditLog> getEntityAuditLogs(String entityType, String entityId, Pageable pageable) {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching audit logs for entity: {}:{} (paginated)", tenantId, entityType, entityId);
        return auditLogRepository.findByEntityTypeAndEntityIdAndTenantIdOrderByTimestampDesc(entityType, entityId, tenantId, pageable);
    }

    /**
     * Get audit logs for a user within tenant
     * MULTI-TENANT SAFE
     */
    public List<AuditLog> getUserAuditLogs(String userId) {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching audit logs for user: {}", tenantId, userId);
        return auditLogRepository.findByUserIdAndTenantIdOrderByTimestampDesc(userId, tenantId);
    }

    /**
     * Get audit logs for a user within tenant (paginated)
     * MULTI-TENANT SAFE
     */
    public Page<AuditLog> getUserAuditLogs(String userId, Pageable pageable) {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching audit logs for user: {} (paginated)", tenantId, userId);
        return auditLogRepository.findByUserIdAndTenantIdOrderByTimestampDesc(userId, tenantId, pageable);
    }

    /**
     * Get audit logs by entity type within tenant
     * MULTI-TENANT SAFE
     */
    public Page<AuditLog> getAuditLogsByEntityType(String entityType, Pageable pageable) {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching audit logs by entity type: {}", tenantId, entityType);
        return auditLogRepository.findByEntityTypeAndTenantIdOrderByTimestampDesc(entityType, tenantId, pageable);
    }

    /**
     * Get audit logs by action within tenant
     * MULTI-TENANT SAFE
     */
    public Page<AuditLog> getAuditLogsByAction(String action, Pageable pageable) {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching audit logs by action: {}", tenantId, action);
        return auditLogRepository.findByActionAndTenantIdOrderByTimestampDesc(action, tenantId, pageable);
    }

    /**
     * Get audit logs within a time range within tenant
     * MULTI-TENANT SAFE
     */
    public Page<AuditLog> getAuditLogsByTimeRange(LocalDateTime start, LocalDateTime end, Pageable pageable) {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching audit logs by time range: {} to {}", tenantId, start, end);
        return auditLogRepository.findByTimestampBetweenAndTenantIdOrderByTimestampDesc(start, end, tenantId, pageable);
    }

    /**
     * Get all audit logs within tenant (paginated)
     * MULTI-TENANT SAFE
     */
    public Page<AuditLog> getAllAuditLogs(Pageable pageable) {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching all audit logs", tenantId);
        return auditLogRepository.findByTenantIdOrderByTimestampDesc(tenantId, pageable);
    }

    /**
     * Get audit logs count within tenant
     * MULTI-TENANT SAFE
     */
    public long getAuditLogCount() {
        String tenantId = getCurrentTenantId();
        return auditLogRepository.countByTenantId(tenantId);
    }

    /**
     * Get audit logs count by entity type within tenant
     * MULTI-TENANT SAFE
     */
    public long getAuditLogCountByEntityType(String entityType) {
        String tenantId = getCurrentTenantId();
        return auditLogRepository.countByEntityTypeAndTenantId(entityType, tenantId);
    }

    /**
     * Get audit logs count by action within tenant
     * MULTI-TENANT SAFE
     */
    public long getAuditLogCountByAction(String action) {
        String tenantId = getCurrentTenantId();
        return auditLogRepository.countByActionAndTenantId(action, tenantId);
    }

    // ===== ADMIN ONLY METHODS - CROSS-TENANT ACCESS =====

    /**
     * ⚠️ ADMIN ONLY - Get audit logs for entity across ALL tenants
     * Use with EXTREME caution - only for super-admin debugging
     */
    public List<AuditLog> getEntityAuditLogsAllTenants(String entityType, String entityId) {
        log.warn("⚠️ ADMIN ONLY: Fetching audit logs for entity {}:{} across ALL tenants", entityType, entityId);
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId);
    }

    /**
     * ⚠️ ADMIN ONLY - Get audit logs for entity across ALL tenants (paginated)
     * Use with EXTREME caution - only for super-admin debugging
     */
    public Page<AuditLog> getEntityAuditLogsAllTenants(String entityType, String entityId, Pageable pageable) {
        log.warn("⚠️ ADMIN ONLY: Fetching audit logs for entity {}:{} across ALL tenants (paginated)", entityType, entityId);
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId, pageable);
    }

    /**
     * ⚠️ ADMIN ONLY - Get audit logs for user across ALL tenants
     * Use with EXTREME caution - only for super-admin debugging
     */
    public List<AuditLog> getUserAuditLogsAllTenants(String userId) {
        log.warn("⚠️ ADMIN ONLY: Fetching audit logs for user {} across ALL tenants", userId);
        return auditLogRepository.findByUserIdOrderByTimestampDesc(userId);
    }

    /**
     * ⚠️ ADMIN ONLY - Get audit logs for user across ALL tenants (paginated)
     * Use with EXTREME caution - only for super-admin debugging
     */
    public Page<AuditLog> getUserAuditLogsAllTenants(String userId, Pageable pageable) {
        log.warn("⚠️ ADMIN ONLY: Fetching audit logs for user {} across ALL tenants (paginated)", userId);
        return auditLogRepository.findByUserIdOrderByTimestampDesc(userId, pageable);
    }

    /**
     * ⚠️ ADMIN ONLY - Get audit logs by entity type across ALL tenants
     * Use with EXTREME caution - only for super-admin debugging
     */
    public Page<AuditLog> getAuditLogsByEntityTypeAllTenants(String entityType, Pageable pageable) {
        log.warn("⚠️ ADMIN ONLY: Fetching audit logs by entity type {} across ALL tenants", entityType);
        return auditLogRepository.findByEntityTypeOrderByTimestampDesc(entityType, pageable);
    }

    /**
     * ⚠️ ADMIN ONLY - Get audit logs by action across ALL tenants
     * Use with EXTREME caution - only for super-admin debugging
     */
    public Page<AuditLog> getAuditLogsByActionAllTenants(String action, Pageable pageable) {
        log.warn("⚠️ ADMIN ONLY: Fetching audit logs by action {} across ALL tenants", action);
        return auditLogRepository.findByActionOrderByTimestampDesc(action, pageable);
    }

    /**
     * ⚠️ ADMIN ONLY - Get audit logs by time range across ALL tenants
     * Use with EXTREME caution - only for super-admin debugging
     */
    public Page<AuditLog> getAuditLogsByTimeRangeAllTenants(LocalDateTime start, LocalDateTime end, Pageable pageable) {
        log.warn("⚠️ ADMIN ONLY: Fetching audit logs by time range across ALL tenants");
        return auditLogRepository.findByTimestampBetweenOrderByTimestampDesc(start, end, pageable);
    }

    /**
     * ⚠️ ADMIN ONLY - Get all audit logs across ALL tenants (paginated)
     * Use with EXTREME caution - only for super-admin debugging
     */
    public Page<AuditLog> getAllAuditLogsAllTenants(Pageable pageable) {
        log.warn("⚠️ ADMIN ONLY: Fetching ALL audit logs across ALL tenants");
        return auditLogRepository.findAll(pageable);
    }

    // Helper methods

    private String getUserName(String userId) {
        if ("SYSTEM".equals(userId)) {
            return "System";
        }

        return userRepository.findById(userId)
                .map(user -> {
                    if (user.getProfile() != null && user.getProfile().getFullName() != null) {
                        return user.getProfile().getFullName();
                    }
                    return user.getUsername();
                })
                .orElse("Unknown");
    }
}
