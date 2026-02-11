package com.ultron.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "profiles")
public class Profile {

    @Id
    private String id;

    // Business ID (PROFILE-XXXXX)
    @Indexed(unique = true)
    private String profileId;

    // Multi-Tenancy Support
    @Indexed
    private String tenantId;  // Organization this profile belongs to (null for system profiles)

    // System vs Custom Profile
    @Builder.Default
    private Boolean isSystemProfile = false;  // true = default template, false = custom profile

    // Basic Information
    @Indexed
    private String profileName;
    private String description;

    // Permissions
    private List<ObjectPermission> objectPermissions;
    private List<FieldPermission> fieldPermissions;
    private SystemPermissions systemPermissions;

    // Status
    @Builder.Default
    private Boolean isActive = true;

    // Soft Delete
    @Builder.Default
    private Boolean isDeleted = false;
    private LocalDateTime deletedAt;
    private String deletedBy;

    // Audit Fields
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    private String createdBy;
    private String createdByName;

    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
    private String lastModifiedByName;

    // Nested class for Object-Level Permissions
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ObjectPermission {
        private String objectName;  // USER, LEAD, ACCOUNT, CONTACT, OPPORTUNITY, etc.

        @Builder.Default
        private Boolean canCreate = false;
        @Builder.Default
        private Boolean canRead = false;
        @Builder.Default
        private Boolean canEdit = false;
        @Builder.Default
        private Boolean canDelete = false;
        @Builder.Default
        private Boolean canViewAll = false;
        @Builder.Default
        private Boolean canModifyAll = false;
    }

    // Nested class for Field-Level Permissions
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FieldPermission {
        private String objectName;  // USER, LEAD, ACCOUNT, etc.
        private String fieldName;   // email, phone, salary, ssn, etc.

        @Builder.Default
        private Boolean canRead = true;
        @Builder.Default
        private Boolean canEdit = true;
        @Builder.Default
        private Boolean isHidden = false;    // Hide field from UI
        @Builder.Default
        private Boolean isEncrypted = false; // Encrypt field value
    }

    // Nested class for System Permissions
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SystemPermissions {
        // API Access
        @Builder.Default
        private Boolean canAccessAPI = true;
        @Builder.Default
        private Integer apiRateLimit = 1000;  // Requests per hour

        // UI Features
        @Builder.Default
        private Boolean canAccessMobileApp = true;
        @Builder.Default
        private Boolean canAccessReports = true;
        @Builder.Default
        private Boolean canAccessDashboards = true;

        // Data Operations
        @Builder.Default
        private Boolean canBulkUpdate = false;
        @Builder.Default
        private Boolean canBulkDelete = false;
        @Builder.Default
        private Boolean canMassEmail = false;

        // Security
        @Builder.Default
        private Boolean canBypassValidation = false;
        @Builder.Default
        private Boolean canRunApex = false;  // Execute custom code
    }
}
