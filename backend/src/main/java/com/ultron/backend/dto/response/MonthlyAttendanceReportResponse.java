package com.ultron.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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

    // Summary
    private Integer workingDays;
    private Integer presentDays;
    private Integer absentDays;
    private Integer lateDays;
    private Integer halfDays;
    private Integer leaveDays;
    private Integer holidays;

    // Time (in hours)
    private Integer totalWorkHours;
    private Integer totalOvertimeHours;
    private Integer totalLateMinutes;

    // Percentage
    private Double attendancePercentage;

    // Daily Details
    private List<DailyAttendanceDetailDTO> dailyDetails;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyAttendanceDetailDTO {
        private LocalDate date;
        private String status;
        private String type;
        private LocalDateTime checkInTime;
        private LocalDateTime checkOutTime;
        private Integer workHours;
        private Integer overtimeMinutes;
        private Integer lateMinutes;
        private Boolean isWeekend;
        private Boolean isHoliday;
        private String leaveType;
    }
}
