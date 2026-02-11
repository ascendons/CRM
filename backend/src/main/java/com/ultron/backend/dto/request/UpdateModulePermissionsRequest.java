package com.ultron.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for updating module permissions
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateModulePermissionsRequest {

    @NotNull(message = "Module permissions cannot be null")
    private List<ModulePermission> modulePermissions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModulePermission {
        @NotNull(message = "Module name is required")
        private String moduleName;

        @NotNull(message = "Display name is required")
        private String displayName;

        @NotNull(message = "Can access flag is required")
        private Boolean canAccess;

        private List<String> includedPaths;
        private String description;
    }
}
