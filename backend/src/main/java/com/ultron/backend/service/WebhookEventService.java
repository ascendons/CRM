package com.ultron.backend.service;

import com.ultron.backend.domain.entity.WebhookEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for publishing and managing webhook events
 * Tracks tenant lifecycle events and system notifications
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WebhookEventService extends BaseTenantService {

    private final MongoTemplate mongoTemplate;

    /**
     * Publish event for organization creation
     */
    public void publishOrganizationCreated(String organizationId, String organizationName) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("organizationId", organizationId);
        payload.put("organizationName", organizationName);

        publishEvent(
                WebhookEvent.EventType.ORGANIZATION_CREATED,
                WebhookEvent.EventCategory.ORGANIZATION,
                "ORGANIZATION",
                organizationId,
                payload
        );
    }

    /**
     * Publish event for user invitation
     */
    public void publishUserInvited(String email, String roleName, String invitedBy) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("email", email);
        payload.put("roleName", roleName);
        payload.put("invitedBy", invitedBy);

        publishEvent(
                WebhookEvent.EventType.USER_INVITED,
                WebhookEvent.EventCategory.USER,
                "USER",
                null,
                payload
        );
    }

    /**
     * Publish event for user joining organization
     */
    public void publishUserJoined(String userId, String email, String roleName) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", userId);
        payload.put("email", email);
        payload.put("roleName", roleName);

        publishEvent(
                WebhookEvent.EventType.USER_JOINED,
                WebhookEvent.EventCategory.USER,
                "USER",
                userId,
                payload
        );
    }

    /**
     * Publish event for entity creation
     */
    public void publishEntityCreated(String entityType, String entityId, Map<String, Object> entityData) {
        publishEvent(
                WebhookEvent.EventType.ENTITY_CREATED,
                WebhookEvent.EventCategory.ENTITY,
                entityType,
                entityId,
                entityData
        );
    }

    /**
     * Publish event for entity update
     */
    public void publishEntityUpdated(String entityType, String entityId, Map<String, Object> changes) {
        publishEvent(
                WebhookEvent.EventType.ENTITY_UPDATED,
                WebhookEvent.EventCategory.ENTITY,
                entityType,
                entityId,
                changes
        );
    }

    /**
     * Publish event for entity deletion
     */
    public void publishEntityDeleted(String entityType, String entityId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("deletedAt", LocalDateTime.now().toString());

        publishEvent(
                WebhookEvent.EventType.ENTITY_DELETED,
                WebhookEvent.EventCategory.ENTITY,
                entityType,
                entityId,
                payload
        );
    }

    /**
     * Publish event for subscription change
     */
    public void publishSubscriptionChanged(String oldPlan, String newPlan, String changeType) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("oldPlan", oldPlan);
        payload.put("newPlan", newPlan);
        payload.put("changeType", changeType);

        WebhookEvent.EventType eventType = switch (changeType) {
            case "UPGRADE" -> WebhookEvent.EventType.SUBSCRIPTION_UPGRADED;
            case "DOWNGRADE" -> WebhookEvent.EventType.SUBSCRIPTION_DOWNGRADED;
            case "CANCEL" -> WebhookEvent.EventType.SUBSCRIPTION_CANCELLED;
            default -> WebhookEvent.EventType.ORGANIZATION_SUBSCRIPTION_CHANGED;
        };

        publishEvent(
                eventType,
                WebhookEvent.EventCategory.SUBSCRIPTION,
                "SUBSCRIPTION",
                null,
                payload
        );
    }

    /**
     * Publish event for usage limit warning
     */
    public void publishUsageLimitWarning(String resourceType, long currentUsage, long limit) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("resourceType", resourceType);
        payload.put("currentUsage", currentUsage);
        payload.put("limit", limit);
        payload.put("percentage", (double) currentUsage / limit * 100);

        publishEvent(
                WebhookEvent.EventType.USAGE_LIMIT_WARNING,
                WebhookEvent.EventCategory.USAGE,
                resourceType,
                null,
                payload
        );
    }

    /**
     * Publish event for usage limit exceeded
     */
    public void publishUsageLimitExceeded(String resourceType, long currentUsage, long limit) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("resourceType", resourceType);
        payload.put("currentUsage", currentUsage);
        payload.put("limit", limit);

        publishEvent(
                WebhookEvent.EventType.USAGE_LIMIT_EXCEEDED,
                WebhookEvent.EventCategory.USAGE,
                resourceType,
                null,
                payload
        );
    }

    /**
     * Publish event for data export
     */
    public void publishDataExportRequested(String exportType) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("exportType", exportType);
        payload.put("requestedAt", LocalDateTime.now().toString());

        publishEvent(
                WebhookEvent.EventType.DATA_EXPORT_REQUESTED,
                WebhookEvent.EventCategory.SECURITY,
                "EXPORT",
                null,
                payload
        );
    }

    /**
     * Core method to publish event
     */
    private void publishEvent(WebhookEvent.EventType eventType,
                               WebhookEvent.EventCategory category,
                               String entityType,
                               String entityId,
                               Map<String, Object> payload) {
        try {
            String tenantId = getCurrentTenantId();
            String eventId = generateEventId();

            WebhookEvent event = WebhookEvent.builder()
                    .eventId(eventId)
                    .tenantId(tenantId)
                    .eventType(eventType)
                    .category(category)
                    .entityType(entityType)
                    .entityId(entityId)
                    .payload(payload)
                    .status(WebhookEvent.EventStatus.PENDING)
                    .occurredAt(LocalDateTime.now())
                    .deliveryAttempts(0)
                    .createdAt(LocalDateTime.now())
                    .createdBy(getCurrentUserId())
                    .isDeleted(false)
                    .build();

            mongoTemplate.save(event);

            log.info("[Tenant: {}] Event published: {} - {}", tenantId, eventType, eventId);

            // TODO: Trigger async webhook delivery
            // webhookDeliveryService.deliver(event);

        } catch (Exception e) {
            log.error("Failed to publish event: {}", eventType, e);
        }
    }

    private String generateEventId() {
        LocalDateTime now = LocalDateTime.now();
        String yearMonth = now.format(DateTimeFormatter.ofPattern("yyyyMM"));
        return "EVT-" + yearMonth + "-" + System.currentTimeMillis();
    }
}
