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

        // Resolve targetUserId to MongoDB _id format for WebSocket compatibility
        String resolvedUserId = resolveToMongoId(targetUserId, tenantId);

        if (resolvedUserId == null) {
            log.error("❌ Could not resolve user ID: {} in tenant: {} - notification will NOT be sent", targetUserId, tenantId);
            log.error("   This means the user does not exist or the ID format is unrecognized");
            return null;
        }

        log.info("✓ User ID resolved: {} → {}", targetUserId, resolvedUserId);

        Notification notification = Notification.builder()
                .tenantId(tenantId)
                .targetUserId(resolvedUserId)  // Use resolved MongoDB _id
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

        // Send to WebSocket using resolved MongoDB _id
        log.info("📤 Sending notification via WebSocket:");
        log.info("   To user (MongoDB _id): {}", resolvedUserId);
        log.info("   Channel: /user/{}/queue/notifications", resolvedUserId);
        messagingTemplate.convertAndSendToUser(resolvedUserId, "/queue/notifications", dto);
        log.info("✓ WebSocket message sent successfully");

        return dto;
    }

    /**
     * Resolve any user ID format to MongoDB _id for WebSocket compatibility.
     * Handles both MongoDB _id (24-char hex) and business userId (USR-YYYY-MM-XXXXX).
     *
     * @param userId User ID in any format
     * @param tenantId Tenant ID for lookup
     * @return MongoDB _id or null if user not found
     */
    private String resolveToMongoId(String userId, String tenantId) {
        log.info("🔍 Resolving user ID: {}", userId);

        if (userId == null) {
            log.error("❌ User ID is NULL");
            return null;
        }

        // If it's already MongoDB _id format (24-char hex), return as-is
        if (userId.matches("^[0-9a-fA-F]{24}$")) {
            log.info("✓ User ID {} is already MongoDB _id format", userId);
            return userId;
        }

        // If it's business userId format (USR-...), lookup MongoDB _id
        if (userId.startsWith("USR-")) {
            log.info("🔍 User ID {} is business userId, looking up MongoDB _id in tenant {}", userId, tenantId);
            return userRepository.findByUserIdAndTenantId(userId, tenantId)
                    .map(user -> {
                        log.info("✓ Found user: {} → MongoDB _id: {}", userId, user.getId());
                        return user.getId();
                    })
                    .orElseGet(() -> {
                        log.error("❌ Business userId {} NOT FOUND in tenant {}", userId, tenantId);
                        log.error("   Available users in tenant: {}",
                            userRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                                .map(u -> u.getUserId() + " (" + u.getEmail() + ")")
                                .collect(java.util.stream.Collectors.joining(", ")));
                        return null;
                    });
        }

        // Unknown format, try to use as-is but log warning
        log.warn("⚠️  Unknown user ID format: {} - attempting to use as-is", userId);
        return userId;
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
