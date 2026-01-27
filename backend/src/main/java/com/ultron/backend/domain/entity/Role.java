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
@Document(collection = "roles")
public class Role {

    @Id
    private String id;

    // Business ID (ROLE-XXXXX)
    @Indexed(unique = true)
    private String roleId;

    // Basic Information
    @Indexed
    private String roleName;
    private String description;

    // Hierarchy
    private String parentRoleId;
    private String parentRoleName;  // Denormalized
    private Integer level;  // Hierarchy level (0 = top level)
    private List<String> childRoleIds;  // List of child role IDs

    // Permissions
    private RolePermissions permissions;

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

    // Nested class for Role Permissions
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RolePermissions {
        // Data Visibility
        @Builder.Default
        private String dataVisibility = "OWN";  // OWN, SUBORDINATES, ALL_USERS, ALL

        // Administrative Permissions
        @Builder.Default
        private Boolean canManageUsers = false;
        @Builder.Default
        private Boolean canManageRoles = false;
        @Builder.Default
        private Boolean canManageProfiles = false;
        @Builder.Default
        private Boolean canViewSetup = false;
        @Builder.Default
        private Boolean canManageSharing = false;

        // System Permissions
        @Builder.Default
        private Boolean canViewAllData = false;
        @Builder.Default
        private Boolean canModifyAllData = false;
        @Builder.Default
        private Boolean canViewAuditLog = false;
        @Builder.Default
        private Boolean canExportData = false;
        @Builder.Default
        private Boolean canImportData = false;

        // Custom Permissions
        private List<String> customPermissions;  // Additional permission strings
    }
}
