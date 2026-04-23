package com.ultron.backend.domain.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "portal_sessions")
public class PortalSession {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    private String customerEmail;
    private String customerId;

    @Indexed(unique = true)
    private String magicToken;

    private boolean used;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}
