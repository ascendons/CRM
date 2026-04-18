package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.PartsRequestStatus;
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
@Document(collection = "parts_requests")
public class PartsRequest {

    @Id
    private String id;

    @Indexed(unique = true)
    private String requestNumber;

    @Indexed
    private String tenantId;

    private String workOrderId;
    private String engineerId;
    private LocalDateTime requestedAt;
    private List<RequestedPart> requestedParts;
    private PartsRequestStatus status;
    private String approvedBy;
    private String warehouseId;
    private LocalDateTime dispatchedAt;
    private LocalDateTime receivedAt;
    private String rejectionReason;

    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RequestedPart {
        private String partId;
        private Integer qty;
        private String reason;
    }
}
