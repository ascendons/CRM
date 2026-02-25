package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Notification;
import com.ultron.backend.dto.response.NotificationDTO;
import com.ultron.backend.multitenancy.TenantContext;
import com.ultron.backend.repository.NotificationRepository;
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

    public NotificationDTO createAndSendNotification(String targetUserId, String title, String message, String type, String actionUrl) {
        String tenantId = TenantContext.getTenantId();

        Notification notification = Notification.builder()
                .tenantId(tenantId)
                .targetUserId(targetUserId)
                .title(title)
                .message(message)
                .type(type)
                .actionUrl(actionUrl)
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);

        NotificationDTO dto = mapToDTO(notification);

        // Send to WebSocket
        messagingTemplate.convertAndSendToUser(targetUserId, "/queue/notifications", dto);

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

    public void markAsRead(String targetUserId, String notificationId) {
        String tenantId = TenantContext.getTenantId();
        Notification notification = notificationRepository.findById(notificationId)
                .filter(n -> n.getTenantId().equals(tenantId) && n.getTargetUserId().equals(targetUserId))
                .orElse(null);

        if (notification != null && !notification.isRead()) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }

    public void markAllAsRead(String targetUserId) {
        String tenantId = TenantContext.getTenantId();
        var unreadNotifications = notificationRepository.findByTenantIdAndTargetUserIdAndIsReadFalse(tenantId, targetUserId);
        
        for (Notification n : unreadNotifications) {
            n.setRead(true);
        }
        
        notificationRepository.saveAll(unreadNotifications);
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
