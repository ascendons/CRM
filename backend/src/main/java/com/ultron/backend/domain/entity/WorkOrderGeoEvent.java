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
@Document(collection = "work_order_geo_events")
public class WorkOrderGeoEvent {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    private String workOrderId;
    private String engineerId;
    private String eventType; // Arrived / Departed
    private Double lat;
    private Double lng;
    private LocalDateTime timestamp;
    private Boolean geofenceMatch;
    private Boolean spoofDetected;
}
