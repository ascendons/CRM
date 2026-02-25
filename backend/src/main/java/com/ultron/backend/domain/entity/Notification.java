package com.ultron.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;

    // Tenant ID for context
    private String tenantId;

    // The user who receives the notification
    private String targetUserId;

    private String title;
    private String message;
    private String type; // e.g., "CHAT_MESSAGE", "SYSTEM_ALERT", "DOCUMENT_SHARED"
    
    // Optional link for clicking the notification (e.g. /dashboard/chat?user=123)
    private String actionUrl;

    @Builder.Default
    private boolean isRead = false;

    @CreatedDate
    private LocalDateTime createdAt;
}
