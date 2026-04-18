package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.AssetCategoryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "asset_categories")
public class AssetCategory {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    private String name;
    private AssetCategoryType type;
    private String description;
    private String defaultChecklistTemplateId;
    private List<String> requiredSkills;
    private Integer maintenanceIntervalDays;

    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
