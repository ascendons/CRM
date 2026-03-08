package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.AttendanceStatus;
import com.ultron.backend.domain.enums.AttendanceType;
import com.ultron.backend.domain.enums.BreakType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "attendances")
@CompoundIndexes({
    @CompoundIndex(name = "attendanceId_tenantId_unique", def = "{'attendanceId': 1, 'tenantId': 1}", unique = true),
    @CompoundIndex(name = "tenantId_userId_date", def = "{'tenantId': 1, 'userId': 1, 'attendanceDate': -1}"),
    @CompoundIndex(name = "tenantId_date_status", def = "{'tenantId': 1, 'attendanceDate': 1, 'status': 1}"),
    @CompoundIndex(name = "tenantId_isDeleted", def = "{'tenantId': 1, 'isDeleted': 1}"),
    @CompoundIndex(name = "userId_date_tenantId", def = "{'userId': 1, 'attendanceDate': -1, 'tenantId': 1}")
})
public class Attendance {

    @Id
    private String id;

    // Business ID (ATT-YYYY-MM-XXXXX)
    private String attendanceId;

    // Multi-tenancy
    @Indexed
    private String tenantId;

    // User Information
    private String userId; // Business userId (USR-YYYY-MM-XXXXX)
    private String userName; // Denormalized
    private String userEmail; // Denormalized
    private String department; // Denormalized

    // Date Tracking
    private LocalDate attendanceDate; // Date only (for grouping)

    // Check-in Details
    private LocalDateTime checkInTime; // Full timestamp in IST
    private AttendanceLocation checkInLocation; // Embedded document
    private String checkInDeviceInfo; // Browser/device info
    private String checkInIpAddress; // IP tracking

    // Check-out Details
    private LocalDateTime checkOutTime;
    private AttendanceLocation checkOutLocation; // Embedded document
    private String checkOutDeviceInfo;
    private String checkOutIpAddress;

    // Work Details
    private AttendanceType type; // OFFICE, REMOTE, FIELD, HYBRID
    private AttendanceStatus status; // PRESENT, LATE, HALF_DAY, ABSENT, ON_LEAVE, HOLIDAY

    // Time Calculations (in minutes)
    private Integer totalWorkMinutes; // Calculated on checkout
    private Integer regularMinutes; // Within shift hours
    private Integer overtimeMinutes; // Beyond shift hours
    private Integer lateMinutes; // Late arrival penalty
    private Integer earlyLeaveMinutes; // Early departure penalty

    // Break Tracking
    @Builder.Default
    private List<BreakRecord> breaks = new ArrayList<>(); // Embedded list
    private Integer totalBreakMinutes;

    // Shift Information
    private String shiftId;
    private String shiftName; // Denormalized
    private LocalTime expectedStartTime; // From shift schedule
    private LocalTime expectedEndTime;

    // Leave Integration
    private String leaveId; // Reference to approved leave (if applicable)
    private String leaveType; // Denormalized: SICK, CASUAL, PAID, etc.

    // Office Location Reference
    private String officeLocationId; // Reference to assigned office location
    private String officeLocationName; // Denormalized

    // Validation & Verification
    private Boolean isLocationVerified; // GPS within geofence
    private String locationValidationMessage;
    private Boolean requiresApproval; // For irregular attendance
    private String approvedBy; // Manager userId
    private LocalDateTime approvedAt;

    // Notes & Remarks
    private String userNotes; // Employee notes
    private String managerNotes; // Manager comments
    private String systemNotes; // Auto-generated notes

    // Soft Delete
    @Builder.Default
    private Boolean isDeleted = false;
    private LocalDateTime deletedAt;
    private String deletedBy;

    // Audit Fields
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    private String createdBy;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;

    // Nested class for Attendance Location (embedded document)
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceLocation {
        private Double latitude;
        private Double longitude;
        private String address; // Reverse geocoded address
        private Double accuracy; // GPS accuracy in meters
        @Builder.Default
        private Boolean isGpsSpoofingDetected = false; // Basic spoofing detection
    }

    // Nested class for Break Record (embedded document)
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BreakRecord {
        private String breakId; // BRK-timestamp
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private Integer durationMinutes;
        private BreakType type; // LUNCH, TEA, PERSONAL, PRAYER
        private AttendanceLocation startLocation;
        private AttendanceLocation endLocation;
    }
}
