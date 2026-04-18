package com.ultron.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class DispatchRequest {

    @NotBlank
    private String workOrderId;

    private List<String> engineerIds;

    private LocalDateTime estimatedArrival;

    private Double gpsLat;
    private Double gpsLng;

    private String reassignReason;
}
