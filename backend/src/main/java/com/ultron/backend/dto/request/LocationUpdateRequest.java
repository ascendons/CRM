package com.ultron.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LocationUpdateRequest {

    @NotNull
    private Double lat;

    @NotNull
    private Double lng;

    private Double accuracy;
    private String workOrderId;
    private Integer batteryLevel;
}
