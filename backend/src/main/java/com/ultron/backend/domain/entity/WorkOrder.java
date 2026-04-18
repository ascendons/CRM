package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "work_orders")
public class WorkOrder {

    @Id
    private String id;

    @Indexed(unique = true)
    private String woNumber;           // WO-timestamp

    @Indexed
    private String tenantId;

    private WorkOrderType type;
    private WorkOrderPriority priority;
    private WorkOrderStatus status;

    // Linked entities
    private String accountId;
    private String contactId;
    private String assetId;
    private String contractId;
    private String serviceRequestId;
    private List<String> assignedEngineerIds;

    // SLA
    private LocalDateTime slaDeadline;
    private boolean slaBreached;

    // Scheduling
    private LocalDate scheduledDate;
    private LocalDateTime actualStartTime;
    private LocalDateTime actualEndTime;

    // Job details
    private String symptoms;
    private String diagnosis;
    private String resolution;
    private String rootCause;

    // Parts
    private List<PartUsed> partsUsed;

    // Checklist
    private String checklistTemplateId;
    private LocalDateTime checklistCompletedAt;

    // Media
    private List<WorkOrderPhoto> photos;

    // Customer sign-off
    private CustomerSignOff customerSignOff;

    private String closureNotes;
    private Integer reopenCount;
    private Double totalLaborHours;

    // Audit
    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartUsed {
        private String partId;
        private Integer qty;
        private String serialNo;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkOrderPhoto {
        private String url;
        private String caption;
        private LocalDateTime uploadedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerSignOff {
        private SignOffMethod method;
        private LocalDateTime verifiedAt;
        private String signatureUrl;
        private String verifiedByName;
    }
}
