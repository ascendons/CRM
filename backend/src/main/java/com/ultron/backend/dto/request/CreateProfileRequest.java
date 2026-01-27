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
public class CreateProfileRequest {

    @NotBlank(message = "Profile name is required")
    @Size(min = 2, max = 100, message = "Profile name must be between 2 and 100 characters")
    private String profileName;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    // Permissions
    private List<ObjectPermissionDTO> objectPermissions;
    private List<FieldPermissionDTO> fieldPermissions;
    private SystemPermissionsDTO systemPermissions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ObjectPermissionDTO {
        @NotBlank(message = "Object name is required")
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
        @NotBlank(message = "Object name is required")
        private String objectName;
        @NotBlank(message = "Field name is required")
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
