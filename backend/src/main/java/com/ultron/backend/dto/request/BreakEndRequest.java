package com.ultron.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BreakEndRequest {

    @NotBlank(message = "Attendance ID is required")
    private String attendanceId;

    @NotBlank(message = "Break ID is required")
    private String breakId;

    private Double latitude;
    private Double longitude;
    private Double accuracy;
}
