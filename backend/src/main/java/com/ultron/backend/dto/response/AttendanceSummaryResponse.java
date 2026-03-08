package com.ultron.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceSummaryResponse {

    private String userId;
    private String userName;
    private LocalDate startDate;
    private LocalDate endDate;

    // Counts
    private Integer presentDays;
    private Integer absentDays;
    private Integer lateDays;
    private Integer halfDays;
    private Integer leaveDays;
    private Integer holidays;
    private Integer workingDays;

    // Time (in hours)
    private Integer totalWorkHours;
    private Integer averageWorkHours;
    private Integer totalOvertimeHours;
    private Integer totalLateMinutes;

    // Percentage
    private Double attendancePercentage;
}
