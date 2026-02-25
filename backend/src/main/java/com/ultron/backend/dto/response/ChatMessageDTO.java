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
public class ChatMessageDTO {
    private String id;
    private String senderId;
    private String senderName; // E.g., from user lookup
    private String recipientId;
    private String recipientType;
    private String content;
    private LocalDateTime timestamp;
}
