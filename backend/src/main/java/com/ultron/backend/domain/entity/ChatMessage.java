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
@Document(collection = "chat_messages")
public class ChatMessage {

    @Id
    private String id;

    // Tenant ID for context
    private String tenantId;

    // ID of the user sending the message
    private String senderId;

    // Can be user ID, "ALL" (for broadcast), or group ID
    private String recipientId;

    // e.g. "USER", "GROUP"
    private String recipientType;

    private String content;

    @CreatedDate
    private LocalDateTime timestamp;
}
