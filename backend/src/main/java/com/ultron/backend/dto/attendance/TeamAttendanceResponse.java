package com.ultron.backend.dto.attendance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Response DTO for team attendance (manager view)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamAttendanceResponse {

    private LocalDate startDate;
    private LocalDate endDate;
    private Integer totalTeamMembers;

    private List<TeamMemberAttendanceDto> teamMembers;

    // Team summary
    private Double teamAttendancePercentage;
    private Integer teamPresentCount;
    private Integer teamAbsentCount;
    private Integer teamOnLeaveCount;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeamMemberAttendanceDto {
        private String userId;
        private String userName;
        private String userEmail;
        private String department;
        private String position;

        // Stats for date range
        private Integer totalDays;
        private Integer presentDays;
        private Integer lateDays;
        private Integer absentDays;
        private Integer leaveDays;
        private Double attendancePercentage;
        private Double averageWorkHours;
        private Integer totalLateMinutes;
        private Integer totalOvertimeMinutes;

        // Current status (for today if date range includes today)
        private String todayStatus;
        private String todayCheckInTime;
        private String todayCheckOutTime;
        private Boolean isTodayCheckedIn;

        // Daily records for calendar view
        private List<DailyRecordDto> dailyRecords;

        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class DailyRecordDto {
            private String date; // YYYY-MM-DD
            private String status;
            private String checkInTime;
            private String checkOutTime;
            private Integer workMinutes;
        }
    }
}
