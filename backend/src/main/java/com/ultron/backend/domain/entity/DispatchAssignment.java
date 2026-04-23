package com.ultron.backend.domain.entity;

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
@Document(collection = "dispatch_assignments")
public class DispatchAssignment {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    private String workOrderId;
    private String engineerId;
    private LocalDateTime dispatchedAt;
    private LocalDateTime estimatedArrival;
    private LocalDateTime arrivedAt;
    private LocalDateTime departedAt;
    private GpsPoint gpsOnDispatch;

    private String reassignedFromEngineerId;
    private String reassignReason;

    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GpsPoint {
        private Double lat;
        private Double lng;
    }
}
