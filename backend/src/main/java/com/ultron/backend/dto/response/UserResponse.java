package com.ultron.backend.dto.response;

import com.ultron.backend.domain.enums.UserRole;
import com.ultron.backend.domain.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    // IDs
    private String id;
    private String userId;

    // Authentication
    private String username;
    private String email;
    private LocalDateTime passwordLastChanged;
    private LocalDateTime passwordExpiresAt;

    // Profile Information
    private UserProfileDTO profile;

    // Access Control
    private String roleId;
    private String roleName;
    private String profileId;
    private String profileName;

    // Legacy fields (for backward compatibility)
    private UserRole role;
    private UserStatus status;

    // Organization Hierarchy
    private String managerId;
    private String managerName;
    private String teamId;
    private String teamName;
    private String territoryId;
    private String territoryName;

    // Settings
    private UserSettingsDTO settings;

    // Security Info (sanitized - no sensitive data)
    private UserSecurityDTO security;

    // Status
    private Boolean isActive;
    private Boolean isDeleted;
    private LocalDateTime deletedAt;
    private String deactivationReason;

    // Audit Fields
    private LocalDateTime createdAt;
    private String createdBy;
    private String createdByName;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
    private String lastModifiedByName;

    // Nested DTOs
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserProfileDTO {
        private String firstName;
        private String lastName;
        private String fullName;
        private String title;
        private String department;
        private String phone;
        private String mobilePhone;
        private String avatar;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSettingsDTO {
        private String timeZone;
        private String language;
        private String dateFormat;
        private String currency;
        private Boolean emailNotifications;
        private Boolean desktopNotifications;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSecurityDTO {
        private Boolean twoFactorEnabled;
        private List<String> allowedIPs;
        private LocalDateTime lastLoginAt;
        private String lastLoginIP;
        private Integer failedLoginAttempts;
        private LocalDateTime lockedUntil;
        // Note: lastPasswordResetAt intentionally excluded for security
    }
}
