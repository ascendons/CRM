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
 * Service for managing audit logs
 * Provides comprehensive audit trail functionality
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    /**
     * Log an audit event asynchronously
     * This method runs in a separate thread to avoid impacting main transaction performance
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
     */
    public AuditLog log(String entityType, String entityId, String entityName,
                        String action, String description,
                        String oldValue, String newValue,
                        String userId, Map<String, Object> metadata) {

        String userName = getUserName(userId);

        AuditLog auditLog = AuditLog.builder()
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

        log.info("Audit log created: entityType={}, entityId={}, action={}, user={}",
                entityType, entityId, action, userName);

        return saved;
    }

    /**
     * Convenience method for state transitions
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
     * Get audit logs for a specific entity
     */
    public List<AuditLog> getEntityAuditLogs(String entityType, String entityId) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId);
    }

    /**
     * Get audit logs for a specific entity (paginated)
     */
    public Page<AuditLog> getEntityAuditLogs(String entityType, String entityId, Pageable pageable) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId, pageable);
    }

    /**
     * Get audit logs for a user
     */
    public List<AuditLog> getUserAuditLogs(String userId) {
        return auditLogRepository.findByUserIdOrderByTimestampDesc(userId);
    }

    /**
     * Get audit logs for a user (paginated)
     */
    public Page<AuditLog> getUserAuditLogs(String userId, Pageable pageable) {
        return auditLogRepository.findByUserIdOrderByTimestampDesc(userId, pageable);
    }

    /**
     * Get audit logs by entity type
     */
    public Page<AuditLog> getAuditLogsByEntityType(String entityType, Pageable pageable) {
        return auditLogRepository.findByEntityTypeOrderByTimestampDesc(entityType, pageable);
    }

    /**
     * Get audit logs by action
     */
    public Page<AuditLog> getAuditLogsByAction(String action, Pageable pageable) {
        return auditLogRepository.findByActionOrderByTimestampDesc(action, pageable);
    }

    /**
     * Get audit logs within a time range
     */
    public Page<AuditLog> getAuditLogsByTimeRange(LocalDateTime start, LocalDateTime end, Pageable pageable) {
        return auditLogRepository.findByTimestampBetweenOrderByTimestampDesc(start, end, pageable);
    }

    /**
     * Get all audit logs (paginated)
     */
    public Page<AuditLog> getAllAuditLogs(Pageable pageable) {
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
