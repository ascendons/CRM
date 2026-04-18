package com.ultron.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DispatchAssignmentResponse {
    private String id;
    private String workOrderId;
    private String engineerId;
    private LocalDateTime dispatchedAt;
    private LocalDateTime estimatedArrival;
    private LocalDateTime arrivedAt;
    private LocalDateTime departedAt;
    private Double gpsLat;
    private Double gpsLng;
    private String reassignReason;
    private LocalDateTime createdAt;
    private String createdBy;
}
