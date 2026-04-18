package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.WorkOrderType;
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
@Document(collection = "work_order_checklists")
public class WorkOrderChecklist {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    private String name;
    private String assetCategoryId;
    private WorkOrderType jobType;
    private List<ChecklistItem> items;

    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChecklistItem {
        private String itemCode;
        private String description;
        private String inputType;       // Pass/Fail, Numeric, Text
        private boolean isMandatory;
        private String failureAction;   // Block / Warn
    }
}
