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
public class ProfileResponse {

    private String id;
    private String profileId;
    private String profileName;
    private String description;

    // Permissions
    private List<ObjectPermissionDTO> objectPermissions;
    private List<FieldPermissionDTO> fieldPermissions;
    private SystemPermissionsDTO systemPermissions;

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
    public static class ObjectPermissionDTO {
        private String objectName;
        private Boolean canCreate;
        private Boolean canRead;
        private Boolean canEdit;
        private Boolean canDelete;
        private Boolean canViewAll;
        private Boolean canModifyAll;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FieldPermissionDTO {
        private String objectName;
        private String fieldName;
        private Boolean canRead;
        private Boolean canEdit;
        private Boolean isHidden;
        private Boolean isEncrypted;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SystemPermissionsDTO {
        private Boolean canAccessAPI;
        private Integer apiRateLimit;
        private Boolean canAccessMobileApp;
        private Boolean canAccessReports;
        private Boolean canAccessDashboards;
        private Boolean canBulkUpdate;
        private Boolean canBulkDelete;
        private Boolean canMassEmail;
        private Boolean canBypassValidation;
        private Boolean canRunApex;
    }
}
