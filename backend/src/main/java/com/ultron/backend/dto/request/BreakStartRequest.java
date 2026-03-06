package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.BreakType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BreakStartRequest {

    @NotBlank(message = "Attendance ID is required")
    private String attendanceId;

    @NotNull(message = "Break type is required")
    private BreakType type;

    private Double latitude;
    private Double longitude;
    private Double accuracy;
}
