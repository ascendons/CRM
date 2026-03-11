package com.ultron.backend.dto.permission;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Response DTO showing user's effective permissions (profile + overrides)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EffectivePermissionsResponse {

    private String userId;
    private String userName;
    private String userEmail;
    private String profileId;
    private String profileName;

    // Permissions organized by module
    private List<ModulePermissions> modules;

    // User-specific overrides
    private List<PermissionOverrideDto> overrides;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModulePermissions {
        private String moduleName;
        private String displayName;
        private List<ObjectPermissions> objects;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ObjectPermissions {
        private String objectName;
        private String displayName;
        private Map<String, PermissionDetail> permissions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PermissionDetail {
        private String action;
        private Boolean granted;
        private String source;  // "PROFILE", "USER_GRANT", "USER_DENY"
        private Boolean isOverride;
    }
}
