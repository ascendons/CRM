package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.WorkOrderPriority;
import com.ultron.backend.domain.enums.WorkOrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateWorkOrderRequest {
    private WorkOrderPriority priority;
    private WorkOrderStatus status;
    private List<String> assignedEngineerIds;
    private LocalDate scheduledDate;
    private String symptoms;
    private String diagnosis;
    private String resolution;
    private String rootCause;
    private String closureNotes;
    private Double totalLaborHours;
    private List<com.ultron.backend.domain.entity.WorkOrder.PartUsed> partsUsed;
    private List<com.ultron.backend.domain.entity.WorkOrder.WorkOrderPhoto> photos;
    private String statusChangeReason;
}
