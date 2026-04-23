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
@Document(collection = "engineer_locations")
public class EngineerLocation {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    private String engineerId;
    private Double lat;
    private Double lng;
    private Double accuracy;

    @Indexed(expireAfterSeconds = 86400)
    private LocalDateTime timestamp;

    private String workOrderId;
    private Integer batteryLevel;
}
