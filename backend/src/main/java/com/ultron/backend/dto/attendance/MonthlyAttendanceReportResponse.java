package com.ultron.backend.dto.attendance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Response DTO for monthly attendance report
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyAttendanceReportResponse {

    private String userId;
    private String userName;
    private String userEmail;
    private String department;
    private Integer year;
    private Integer month;

    // Summary counts
    private Integer totalWorkingDays;
    private Integer presentDays;
    private Integer lateDays;
    private Integer absentDays;
    private Integer halfDays;
    private Integer leaveDays;
    private Integer weekOffs;
    private Integer holidays;

    // Percentages
    private Double attendancePercentage;
    private Double punctualityPercentage; // Present on time / Total present days

    // Time-based stats
    private Integer totalWorkMinutes;
    private Double averageWorkHoursPerDay;
    private Integer totalOvertimeMinutes;
    private Integer totalLateMinutes;
    private Integer totalBreakMinutes;

    // Early/late patterns
    private Integer earlyCheckIns; // Before shift start time
    private Integer lateCheckIns; // After grace period
    private Integer earlyCheckOuts; // Before shift end time
    private Integer overtimeDays;

    // Day-wise breakdown
    private List<DayAttendanceDto> dailyAttendance;

    // Weekly trends
    private Map<String, Integer> weeklyStats; // Week number -> present days

    // Leave breakdown by type
    private Map<String, Integer> leaveTypeBreakdown;

    // Performance indicators
    private String performanceRating; // EXCELLENT, GOOD, AVERAGE, POOR
    private List<String> remarks;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DayAttendanceDto {
        private LocalDate date;
        private String dayOfWeek;
        private String status; // PRESENT, LATE, ABSENT, ON_LEAVE, etc.
        private String checkInTime;
        private String checkOutTime;
        private Integer workMinutes;
        private Integer lateMinutes;
        private Integer overtimeMinutes;
        private Boolean isLocationVerified;
        private String leaveType;
    }
}
