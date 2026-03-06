package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.AttendanceType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckInRequest {

    @NotNull(message = "Attendance type is required")
    private AttendanceType type; // OFFICE, REMOTE, FIELD

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;

    private Double accuracy;
    private String address;
    private String deviceInfo;
    private String userNotes;

    // Required for OFFICE type
    private String officeLocationId;
}
