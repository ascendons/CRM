package com.ultron.backend.dto.attendance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for detailed daily attendance of a single team member
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DetailedDailyAttendanceDto {

    // User information
    private String userId;
    private String userName;
    private String userEmail;
    private String department;

    // Attendance information
    private String attendanceId;
    private String status;
    private String checkInTime;
    private String checkOutTime;
    private String type;

    // Work metrics
    private Integer totalWorkMinutes;
    private Integer lateMinutes;
    private Integer overtimeMinutes;

    // Location
    private Boolean isLocationVerified;
    private String locationValidationMessage;
    private Double checkInLatitude;
    private Double checkInLongitude;
    private String checkInAddress;

    // Breaks
    private List<BreakDto> breaks;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BreakDto {
        private String breakId;
        private String type;
        private String startTime;
        private String endTime;
        private Integer durationMinutes;
    }
}
