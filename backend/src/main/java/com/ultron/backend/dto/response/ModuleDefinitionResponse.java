package com.ultron.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for available module definitions (registry)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModuleDefinitionResponse {
    private String moduleName;
    private String displayName;
    private List<String> includedPaths;
    private String description;
    private String category;  // For UI grouping
}
