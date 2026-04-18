package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.AssetCategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAssetCategoryRequest {

    @NotBlank(message = "Category name is required")
    private String name;

    @NotNull(message = "Category type is required")
    private AssetCategoryType type;

    private String description;
    private String defaultChecklistTemplateId;
    private List<String> requiredSkills;
    private Integer maintenanceIntervalDays;
}
