package com.ultron.backend.dto.response;

import com.ultron.backend.domain.enums.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkOrderResponse {
    private String id;
    private String woNumber;
    private WorkOrderType type;
    private WorkOrderPriority priority;
    private WorkOrderStatus status;
    private String accountId;
    private String contactId;
    private String assetId;
    private String contractId;
    private String serviceRequestId;
    private List<String> assignedEngineerIds;
    private LocalDateTime slaDeadline;
    private boolean slaBreached;
    private LocalDate scheduledDate;
    private LocalDateTime actualStartTime;
    private LocalDateTime actualEndTime;
    private String symptoms;
    private String diagnosis;
    private String resolution;
    private String rootCause;
    private String checklistTemplateId;
    private LocalDateTime checklistCompletedAt;
    private String closureNotes;
    private Integer reopenCount;
    private Double totalLaborHours;
    private List<com.ultron.backend.domain.entity.WorkOrder.PartUsed> partsUsed;
    private List<com.ultron.backend.domain.entity.WorkOrder.WorkOrderPhoto> photos;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
