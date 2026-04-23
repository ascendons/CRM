package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.SignatureStatus;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "signature_requests")
public class SignatureRequest {

    @Id
    private String id;

    @Indexed(unique = true)
    private String requestId;

    @Indexed
    private String tenantId;

    private String documentType;
    private String documentId;
    private String signerEmail;
    private String signerName;

    @Indexed(unique = true)
    private String token;

    private LocalDateTime signedAt;
    private String signatureImageBase64;
    private String ipAddress;
    private SignatureStatus status;
    private LocalDateTime expiresAt;

    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
