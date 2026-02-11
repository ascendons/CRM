package com.ultron.backend.dto.response;

import com.ultron.backend.domain.entity.Profile;
import com.ultron.backend.domain.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Response DTO containing all permissions for a user
 * Loaded once on login and cached in frontend
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPermissionsResponse {

    // Module-based permissions (from Role)
    private List<Role.ModulePermission> modules;

    // Object-level permissions (from Profile)
    private List<Profile.ObjectPermission> objectPermissions;

    // System-level permissions (from Role)
    private SystemPermissionsDTO systemPermissions;

    // Field-level permissions (from Profile) - optional
    private List<Profile.FieldPermission> fieldPermissions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SystemPermissionsDTO {
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
    }
}
