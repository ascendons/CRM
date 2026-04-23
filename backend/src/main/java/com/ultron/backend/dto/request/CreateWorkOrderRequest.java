package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.WorkOrderPriority;
import com.ultron.backend.domain.enums.WorkOrderType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CreateWorkOrderRequest {

    @NotNull(message = "Work order type is required")
    private WorkOrderType type;

    @NotBlank(message = "Account ID is required")
    private String accountId;

    private String contactId;
    private String assetId;
    private String contractId;
    private String serviceRequestId;

    private List<String> assignedEngineerIds;

    @NotNull(message = "Priority is required")
    private WorkOrderPriority priority;

    private LocalDate scheduledDate;
    private String symptoms;
    private String checklistTemplateId;
}
