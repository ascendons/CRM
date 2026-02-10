package com.ultron.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Entity for managing user invitations to organizations
 * Allows organizations to invite new users to join their tenant
 */
@Document(collection = "organization_invitations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationInvitation {

    @Id
    private String id;

    @Indexed(unique = true)
    private String invitationId;  // INV-YYYYMM-XXXXX

    @Indexed
    private String tenantId;  // Organization sending the invitation

    @Indexed
    private String email;  // Email of the invited user

    private String invitedByUserId;  // User who sent the invitation
    private String invitedByName;

    private String roleId;  // Role to assign to the user
    private String roleName;

    private String profileId;  // Profile to assign to the user
    private String profileName;

    private InvitationStatus status;

    @Indexed(expireAfterSeconds = 604800)  // 7 days TTL
    private LocalDateTime expiresAt;

    private LocalDateTime sentAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime revokedAt;

    private String acceptedByUserId;  // User ID if they accepted
    private String revokedByUserId;   // User who revoked the invitation

    private String personalMessage;  // Optional message from inviter

    // Audit fields
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
    private boolean isDeleted;

    public enum InvitationStatus {
        PENDING,
        ACCEPTED,
        REVOKED,
        EXPIRED
    }

    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean isPending() {
        return status == InvitationStatus.PENDING && !isExpired();
    }
}
