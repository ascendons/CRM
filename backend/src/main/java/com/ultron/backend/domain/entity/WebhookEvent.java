package com.ultron.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Entity for storing webhook events
 * Tracks tenant lifecycle events and system notifications
 */
@Document(collection = "webhook_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebhookEvent {

    @Id
    private String id;

    @Indexed
    private String eventId;  // EVT-YYYYMM-XXXXX

    @Indexed
    private String tenantId;

    private EventType eventType;

    private EventCategory category;

    private String entityType;  // LEAD, CONTACT, OPPORTUNITY, etc.

    private String entityId;

    private Map<String, Object> payload;  // Event data

    private EventStatus status;

    private LocalDateTime occurredAt;

    // Webhook delivery tracking
    private String webhookUrl;

    private Integer deliveryAttempts;

    private LocalDateTime lastDeliveryAttempt;

    private LocalDateTime nextRetryAt;

    private String deliveryError;

    // Audit fields
    private LocalDateTime createdAt;

    private String createdBy;

    private boolean isDeleted;

    public enum EventType {
        // Organization events
        ORGANIZATION_CREATED,
        ORGANIZATION_UPDATED,
        ORGANIZATION_DELETED,
        ORGANIZATION_SUBSCRIPTION_CHANGED,
        ORGANIZATION_LIMIT_EXCEEDED,

        // User events
        USER_INVITED,
        USER_JOINED,
        USER_REMOVED,
        USER_ROLE_CHANGED,

        // Entity events
        ENTITY_CREATED,
        ENTITY_UPDATED,
        ENTITY_DELETED,

        // Subscription events
        SUBSCRIPTION_UPGRADED,
        SUBSCRIPTION_DOWNGRADED,
        SUBSCRIPTION_RENEWED,
        SUBSCRIPTION_CANCELLED,
        SUBSCRIPTION_EXPIRED,

        // Usage events
        USAGE_LIMIT_WARNING,
        USAGE_LIMIT_EXCEEDED,

        // Security events
        UNAUTHORIZED_ACCESS_ATTEMPT,
        DATA_EXPORT_REQUESTED,
        DATA_EXPORT_COMPLETED
    }

    public enum EventCategory {
        ORGANIZATION,
        USER,
        ENTITY,
        SUBSCRIPTION,
        USAGE,
        SECURITY
    }

    public enum EventStatus {
        PENDING,
        DELIVERED,
        FAILED,
        CANCELLED
    }
}
