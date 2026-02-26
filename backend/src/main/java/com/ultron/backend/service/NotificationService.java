package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Notification;
import com.ultron.backend.domain.entity.User;
import com.ultron.backend.dto.response.NotificationDTO;
import com.ultron.backend.multitenancy.TenantContext;
import com.ultron.backend.repository.NotificationRepository;
import com.ultron.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

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
     * Mark a notification as read.
     * SECURITY: Only the notification owner can mark it as read.
     *
     * @param notificationId The notification to mark as read
     * @param authenticatedUserId The authenticated user making the request
     */
    public void markAsRead(String notificationId, String authenticatedUserId) {
        String tenantId = TenantContext.getTenantId();

        Notification notification = notificationRepository.findById(notificationId)
                .orElse(null);

        if (notification == null) {
            log.warn("Notification {} not found", notificationId);
            return;
        }

        // Security check: Verify tenant match
        if (!notification.getTenantId().equals(tenantId)) {
            log.warn("User {} attempted to access notification from different tenant", authenticatedUserId);
            throw new SecurityException("Access denied");
        }

        // Security check: Verify user owns this notification
        if (!notification.getTargetUserId().equals(authenticatedUserId)) {
            log.warn("User {} attempted to mark notification {} belonging to user {} as read",
                    authenticatedUserId, notificationId, notification.getTargetUserId());
            throw new SecurityException("Not authorized to modify this notification");
        }

        if (!notification.isRead()) {
            notification.setRead(true);
            notificationRepository.save(notification);
            log.debug("Notification {} marked as read by user {}", notificationId, authenticatedUserId);
        }
    }

    /**
     * Mark all notifications as read for the authenticated user.
     * SECURITY: Uses authenticated user ID, not a parameter that could be manipulated.
     *
     * @param authenticatedUserId The authenticated user making the request
     */
    public void markAllAsRead(String authenticatedUserId) {
        String tenantId = TenantContext.getTenantId();
        var unreadNotifications = notificationRepository.findByTenantIdAndTargetUserIdAndIsReadFalse(
                tenantId, authenticatedUserId);

        if (!unreadNotifications.isEmpty()) {
            for (Notification n : unreadNotifications) {
                n.setRead(true);
            }
            notificationRepository.saveAll(unreadNotifications);
            log.debug("Marked {} notifications as read for user {}", unreadNotifications.size(), authenticatedUserId);
        }
    }

    private NotificationDTO mapToDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .targetUserId(notification.getTargetUserId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .actionUrl(notification.getActionUrl())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
