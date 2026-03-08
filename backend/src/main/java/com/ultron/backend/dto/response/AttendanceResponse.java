package com.ultron.backend.dto.response;

import com.ultron.backend.domain.enums.AttendanceStatus;
import com.ultron.backend.domain.enums.AttendanceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceResponse {

    private String id;
    private String attendanceId;

    // User Information
    private String userId;
    private String userName;
    private String userEmail;
    private String department;

    // Date and Time
    private LocalDate attendanceDate;
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;

    // Location
    private AttendanceLocationDTO checkInLocation;
    private AttendanceLocationDTO checkOutLocation;

    // Work Details
    private AttendanceType type;
    private AttendanceStatus status;

    // Time Calculations (in minutes)
    private Integer totalWorkMinutes;
    private Integer regularMinutes;
    private Integer overtimeMinutes;
    private Integer lateMinutes;
    private Integer earlyLeaveMinutes;

    // Break Tracking
    private List<BreakRecordDTO> breaks;
    private Integer totalBreakMinutes;

    // Shift Information
    private String shiftId;
    private String shiftName;
    private LocalTime expectedStartTime;
    private LocalTime expectedEndTime;

    // Leave Integration
    private String leaveId;
    private String leaveType;

    // Office Location
    private String officeLocationId;
    private String officeLocationName;

    // Validation & Verification
    private Boolean isLocationVerified;
    private String locationValidationMessage;
    private Boolean requiresApproval;
    private String approvedBy;
    private LocalDateTime approvedAt;

    // Notes
    private String userNotes;
    private String managerNotes;
    private String systemNotes;

    // System Fields
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
}
