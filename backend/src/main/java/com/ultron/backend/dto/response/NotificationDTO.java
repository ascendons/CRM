package com.ultron.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private String id;
    private String targetUserId;
    private String title;
    private String message;
    private String type;
    private String actionUrl;
    private boolean isRead;
    private LocalDateTime createdAt;
}
