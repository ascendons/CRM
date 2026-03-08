package com.ultron.backend.dto.attendance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Response DTO for daily attendance dashboard (real-time view)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyAttendanceDashboardResponse {

    private LocalDate date;
    private Integer totalEmployees;
    private Integer totalWorkingEmployees; // Excluding on leave, week off, holidays

    // Status counts
    private Integer presentCount;
    private Integer lateCount;
    private Integer absentCount;
    private Integer onLeaveCount;
    private Integer halfDayCount;
    private Integer weekOffCount;
    private Integer holidayCount;

    // Percentages
    private Double presentPercentage;
    private Double latePercentage;
    private Double absentPercentage;

    // Time-based stats
    private Integer notCheckedInCount; // Working employees not checked in yet
    private Integer checkedInCount;
    private Integer checkedOutCount;
    private Integer onBreakCount;

    // Work hours
    private Double averageWorkHours;
    private Integer overtimeCount; // Employees with overtime
    private Double totalOvertimeHours;

    // Recent activities (last 10)
    private List<RecentActivityDto> recentActivities;

    // Department-wise breakdown
    private Map<String, DepartmentStatsDto> departmentStats;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentActivityDto {
        private String userId;
        private String userName;
        private String activity; // "CHECKED_IN", "CHECKED_OUT", "BREAK_START", "BREAK_END"
        private String timestamp;
        private String location;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DepartmentStatsDto {
        private Integer total;
        private Integer present;
        private Integer late;
        private Integer absent;
        private Integer onLeave;
        private Double presentPercentage;
    }
}
