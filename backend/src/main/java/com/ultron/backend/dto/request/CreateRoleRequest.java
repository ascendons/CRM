package com.ultron.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRoleRequest {

    @NotBlank(message = "Role name is required")
    @Size(min = 2, max = 100, message = "Role name must be between 2 and 100 characters")
    private String roleName;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    // Hierarchy
    private String parentRoleId;

    // Permissions
    private RolePermissionsDTO permissions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RolePermissionsDTO {
        private String dataVisibility;  // OWN, SUBORDINATES, ALL_USERS, ALL
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
