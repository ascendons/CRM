package com.ultron.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Audit log entity for tracking state transitions and important actions
 * Provides comprehensive audit trail for compliance and debugging
 */
@Document(collection = "audit_logs")
@CompoundIndexes({
    @CompoundIndex(name = "entity_type_id_idx", def = "{'entityType': 1, 'entityId': 1, 'timestamp': -1}"),
    @CompoundIndex(name = "user_timestamp_idx", def = "{'userId': 1, 'timestamp': -1}")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    private String id;

    // Multi-tenancy
    @Indexed
    private String tenantId;

    // Entity Information
    @Indexed
    private String entityType;  // "PROPOSAL", "PRODUCT", "LEAD", etc.

    @Indexed
    private String entityId;    // MongoDB ObjectId of the entity

    private String entityName;  // Friendly name (e.g., proposal title, product name)

    // Action Information
    @Indexed
    private String action;      // "CREATED", "SENT", "ACCEPTED", "REJECTED", "UPDATED", "DELETED", etc.

    private String description; // Human-readable description of the action

    // State Transition
    private String oldValue;    // Previous state/value (e.g., "DRAFT")
    private String newValue;    // New state/value (e.g., "SENT")

    // User Information
    @Indexed
    private String userId;      // User who performed the action
    private String userName;    // User's display name

    // Timestamp
    @Indexed
    private LocalDateTime timestamp;

    // Additional Context
    private String ipAddress;   // Optional: IP address of the user
    private String userAgent;   // Optional: Browser/client information

    // Metadata (flexible for additional data)
    private Map<String, Object> metadata;  // Additional context-specific data
}
