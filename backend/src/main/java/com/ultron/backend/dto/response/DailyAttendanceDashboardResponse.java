package com.ultron.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyAttendanceDashboardResponse {

    private LocalDate date;

    // Counts
    private Integer totalEmployees;
    private Integer presentCount;
    private Integer absentCount;
    private Integer lateCount;
    private Integer onLeaveCount;
    private Integer remoteCount;
    private Integer officeCount;
    private Integer fieldCount;
    private Integer notCheckedInCount;

    // Detailed list
    private List<UserAttendanceStatusDTO> employeesList;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserAttendanceStatusDTO {
        private String userId;
        private String userName;
        private String userEmail;
        private String department;
        private String status;
        private String type;
        private String checkInTime;
        private String checkOutTime;
        private Boolean isCheckedIn;
        private Integer lateMinutes;
    }
}
