package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.ServiceRequestSource;
import com.ultron.backend.domain.enums.ServiceRequestStatus;
import com.ultron.backend.domain.enums.WorkOrderPriority;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "service_requests")
public class ServiceRequest {

    @Id
    private String id;

    @Indexed(unique = true)
    private String srNumber;            // SR-timestamp

    @Indexed
    private String tenantId;

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

    // Audit
    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
