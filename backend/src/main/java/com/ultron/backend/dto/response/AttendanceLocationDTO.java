package com.ultron.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceLocationDTO {
    private Double latitude;
    private Double longitude;
    private String address;
    private Double accuracy;
    private Boolean isGpsSpoofingDetected;
}
