package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.ChecklistItemStatus;
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
@Document(collection = "work_order_checklist_responses")
public class WorkOrderChecklistResponse {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    @Indexed
    private String workOrderId;

    private String templateId;
    private String engineerId;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private List<ItemResponse> responses;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemResponse {
        private String itemCode;
        private ChecklistItemStatus status;
        private String value;
        private String note;
        private String photoUrl;
    }
}
