package com.ultron.backend.dto.response;

import com.ultron.backend.domain.enums.ServiceRequestSource;
import com.ultron.backend.domain.enums.ServiceRequestStatus;
import com.ultron.backend.domain.enums.WorkOrderPriority;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceRequestResponse {
    private String id;
    private String srNumber;
    private ServiceRequestSource source;
    private String accountId;
    private String contactId;
    private String assetId;
    private String description;
    private WorkOrderPriority priority;
    private ServiceRequestStatus status;
    private String workOrderId;
    private LocalDateTime slaDeadline;
    private LocalDateTime acknowledgedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
