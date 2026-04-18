package com.ultron.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class EngineerLocationResponse {
    private String engineerId;
    private Double lat;
    private Double lng;
    private Double accuracy;
    private LocalDateTime timestamp;
    private String workOrderId;
    private Integer batteryLevel;
}
