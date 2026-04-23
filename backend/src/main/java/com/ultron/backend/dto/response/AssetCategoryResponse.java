package com.ultron.backend.dto.response;

import com.ultron.backend.domain.enums.AssetCategoryType;
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
public class AssetCategoryResponse {
    private String id;
    private String name;
    private AssetCategoryType type;
    private String description;
    private String defaultChecklistTemplateId;
    private List<String> requiredSkills;
    private Integer maintenanceIntervalDays;
    private LocalDateTime createdAt;
    private String createdBy;
}
