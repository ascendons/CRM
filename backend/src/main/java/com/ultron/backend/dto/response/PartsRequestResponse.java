package com.ultron.backend.dto.response;

import com.ultron.backend.domain.enums.PartsRequestStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PartsRequestResponse {
    private String id;
    private String requestNumber;
    private String workOrderId;
    private String engineerId;
    private LocalDateTime requestedAt;
    private List<PartItem> requestedParts;
    private PartsRequestStatus status;
    private String approvedBy;
    private String warehouseId;
    private LocalDateTime dispatchedAt;
    private LocalDateTime receivedAt;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private String createdBy;

    @Data
    @Builder
    public static class PartItem {
        private String partId;
        private Integer qty;
        private String reason;
    }
}
