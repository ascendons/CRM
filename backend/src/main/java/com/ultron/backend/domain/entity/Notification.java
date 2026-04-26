package com.ultron.backend.domain.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    private String tenantId;
    private String targetUserId;
    private String title;
    private String message;
    private String type;
    private String actionUrl;

    // Explicitly name the JSON property to ensure correct serialization
    @JsonProperty("isRead")
    private boolean isRead;

    @CreatedDate
    private LocalDateTime createdAt;
}
