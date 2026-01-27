package com.ultron.backend.dto.response;

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
public class RoleResponse {

    private String id;
    private String roleId;
    private String roleName;
    private String description;

    // Hierarchy
    private String parentRoleId;
    private String parentRoleName;
    private Integer level;
    private List<String> childRoleIds;

    // Permissions
    private RolePermissionsDTO permissions;

    // Status
    private Boolean isActive;
    private Boolean isDeleted;

    // Audit
    private LocalDateTime createdAt;
    private String createdBy;
    private String createdByName;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
    private String lastModifiedByName;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RolePermissionsDTO {
        private String dataVisibility;
        private Boolean canManageUsers;
        private Boolean canManageRoles;
        private Boolean canManageProfiles;
        private Boolean canViewSetup;
        private Boolean canManageSharing;
        private Boolean canViewAllData;
        private Boolean canModifyAllData;
        private Boolean canViewAuditLog;
        private Boolean canExportData;
        private Boolean canImportData;
        private List<String> customPermissions;
    }
}
