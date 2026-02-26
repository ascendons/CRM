package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.UserRole;
import com.ultron.backend.domain.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
@CompoundIndexes({
    // Multi-tenant unique constraints: userId, username, and email must be unique PER tenant
    @CompoundIndex(name = "userId_tenantId_unique", def = "{'userId': 1, 'tenantId': 1}", unique = true),
    @CompoundIndex(name = "username_tenantId_unique", def = "{'username': 1, 'tenantId': 1}", unique = true),
    @CompoundIndex(name = "email_tenantId_unique", def = "{'email': 1, 'tenantId': 1}", unique = true),
    // Performance indexes
    @CompoundIndex(name = "tenantId_isDeleted", def = "{'tenantId': 1, 'isDeleted': 1}"),
    @CompoundIndex(name = "tenantId_status_isDeleted", def = "{'tenantId': 1, 'status': 1, 'isDeleted': 1}")
})
public class User {

    @Id
    private String id;

    // Business ID (USR-YYYY-MM-XXXXX)
    // Note: Unique per tenant via compound index above
    private String userId;

    // Multi-tenancy
    @Indexed
    private String tenantId;  // Organization this user belongs to

    // User Type (system vs tenant users)
    @Builder.Default
    private String userType = "TENANT_USER";  // SYSTEM_ADMIN, TENANT_ADMIN, TENANT_USER

    // Authentication
    // Note: Unique per tenant via compound indexes above
    private String username;

    private String email;

    private String password;
    private LocalDateTime passwordLastChanged;
    private LocalDateTime passwordExpiresAt;

    // Profile Information (embedded document)
    private UserProfile profile;

    // Access Control
    private String roleId;
    private String roleName;  // Denormalized
    private String profileId;
    private String profileName;  // Denormalized

    // Organization Hierarchy
    private String managerId;
    private String managerName;  // Denormalized
    private String teamId;
    private String teamName;  // Denormalized
    private String territoryId;
    private String territoryName;  // Denormalized

    // Legacy fields (keep for backward compatibility)
    private String fullName;  // Will be populated from profile.fullName

    @Builder.Default
    private UserRole role = UserRole.USER;  // Legacy enum, kept for compatibility

    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    // Settings (embedded document)
    private UserSettings settings;

    // Security (embedded document)
    private UserSecurity security;

    // Soft Delete
    @Builder.Default
    private Boolean isDeleted = false;
    private LocalDateTime deletedAt;
    private String deletedBy;
    private String deactivationReason;

    // Audit Fields
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    private String createdBy;
    private String createdByName;  // Denormalized

    private LocalDateTime updatedAt;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
    private String lastModifiedByName;  // Denormalized

    // Nested class for User Profile (embedded document)
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserProfile {
        private String firstName;
        private String lastName;
        private String fullName;  // Computed: firstName + lastName
        private String title;  // Job title
        private String department;
        private String phone;
        private String mobilePhone;
        private String avatar;  // URL to avatar image
    }

    // Nested class for User Settings (embedded document)
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSettings {
        @Builder.Default
        private String timeZone = "Asia/Kolkata";
        @Builder.Default
        private String language = "en";
        @Builder.Default
        private String dateFormat = "DD/MM/YYYY";
        @Builder.Default
        private String currency = "INR";
        @Builder.Default
        private Boolean emailNotifications = true;
        @Builder.Default
        private Boolean desktopNotifications = true;
    }

    // Nested class for User Security (embedded document)
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSecurity {
        @Builder.Default
        private Boolean twoFactorEnabled = false;
        private List<String> allowedIPs;  // IP whitelist for this user
        private LocalDateTime lastLoginAt;
        private String lastLoginIP;
        private LocalDateTime lastPasswordResetAt;
        @Builder.Default
        private Integer failedLoginAttempts = 0;
        private LocalDateTime lockedUntil;  // null if not locked
    }
}
