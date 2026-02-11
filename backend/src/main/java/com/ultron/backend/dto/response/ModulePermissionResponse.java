package com.ultron.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for module permissions
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModulePermissionResponse {
    private String moduleName;
    private String displayName;
    private Boolean canAccess;
    private List<String> includedPaths;
    private String description;
}
