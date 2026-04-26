package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Notification;
import com.ultron.backend.dto.response.NotificationDTO;
import com.ultron.backend.multitenancy.TenantContext;
import com.ultron.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final MongoTemplate mongoTemplate;

    public NotificationDTO createAndSendNotification(String targetUserId, String title, String message, String type, String actionUrl) {
        String tenantId = TenantContext.getTenantId();

        log.info("🔔 createAndSendNotification called:");
        log.info("   Target User ID: {}", targetUserId);
        log.info("   Title: {}", title);
        log.info("   Type: {}", type);
        log.info("   Tenant ID: {}", tenantId);

        if (targetUserId == null) {
            log.error("❌ Target User ID is NULL. Cannot send notification.");
            return null;
        }

        Notification notification = Notification.builder()
                .tenantId(tenantId)
                .targetUserId(targetUserId)  // Keep original business userId for consistency
                .title(title)
                .message(message)
                .type(type)
                .actionUrl(actionUrl)
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        log.info("✓ Notification saved to database with ID: {}", notification.getId());

        NotificationDTO dto = mapToDTO(notification);

        // Send to WebSocket using the business userId (matches WebSocket Principal name)
        log.info("📤 Sending notification via WebSocket:");
        log.info("   To user: {}", targetUserId);
        log.info("   Channel: /user/{}/queue/notifications", targetUserId);
        messagingTemplate.convertAndSendToUser(targetUserId, "/queue/notifications", dto);
        log.info("✓ WebSocket message sent successfully");

        return dto;
    }



    public Page<NotificationDTO> getUserNotifications(String targetUserId, Pageable pageable) {
        String tenantId = TenantContext.getTenantId();
        return notificationRepository.findByTenantIdAndTargetUserIdOrderByCreatedAtDesc(tenantId, targetUserId, pageable)
                .map(this::mapToDTO);
    }

    public long getUnreadCount(String targetUserId) {
        String tenantId = TenantContext.getTenantId();
        return notificationRepository.countByTenantIdAndTargetUserIdAndIsReadFalse(tenantId, targetUserId);
    }

    /**
     * Mark a notification as read using MongoTemplate for reliable update.
     */
    public void markAsRead(String notificationId, String authenticatedUserId) {
        String tenantId = TenantContext.getTenantId();

        log.info("markAsRead called: notificationId={}, userId={}, tenantId={}", notificationId, authenticatedUserId, tenantId);

        // First verify the notification exists
        Notification notification = notificationRepository.findById(notificationId).orElse(null);
        if (notification == null) {
            log.warn("Notification {} not found", notificationId);
            return;
        }

        // Security checks
        if (!notification.getTenantId().equals(tenantId)) {
            log.warn("User {} attempted to access notification from different tenant", authenticatedUserId);
            throw new SecurityException("Access denied");
        }

        if (!notification.getTargetUserId().equals(authenticatedUserId)) {
            log.warn("User {} attempted to mark notification {} belonging to user {} as read",
                    authenticatedUserId, notificationId, notification.getTargetUserId());
            throw new SecurityException("Not authorized to modify this notification");
        }

        // Use MongoTemplate with explicit collection and $set operator
        Query query = Query.query(Criteria.where("_id").is(notificationId));
        Update update = new Update();
        update.set("isRead", true);
        // Also set it with $set to ensure it works regardless of field existence
        var result = mongoTemplate.updateFirst(query, update, Notification.class);

        log.info("markAsRead result: notificationId={}, modified={}", notificationId, result.getModifiedCount());
    }

    /**
     * Mark all notifications as read for the authenticated user.
     */
    public void markAllAsRead(String authenticatedUserId) {
        String tenantId = TenantContext.getTenantId();

        log.info("markAllAsRead called: userId={}, tenantId={}", authenticatedUserId, tenantId);

        // Get all unread notifications
        var unreadNotifications = notificationRepository.findByTenantIdAndTargetUserIdAndIsReadFalse(
                tenantId, authenticatedUserId);

        log.info("Found {} unread notifications", unreadNotifications.size());

        if (!unreadNotifications.isEmpty()) {
            // Update via MongoTemplate for reliability
            Query query = Query.query(
                    Criteria.where("tenantId").is(tenantId)
                            .and("targetUserId").is(authenticatedUserId)
                            .and("isRead").is(false)
            );
            Update update = new Update();
            update.set("isRead", true);
            var result = mongoTemplate.updateMulti(query, update, Notification.class);
            log.info("markAllAsRead via MongoTemplate: modifiedCount={}", result.getModifiedCount());
        }
    }

    private NotificationDTO mapToDTO(Notification notification) {
        boolean isReadValue = notification.isRead();
        log.debug("mapToDTO: notificationId={}, isRead={}", notification.getId(), isReadValue);

        return NotificationDTO.builder()
                .id(notification.getId())
                .targetUserId(notification.getTargetUserId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .actionUrl(notification.getActionUrl())
                .isRead(isReadValue)
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
