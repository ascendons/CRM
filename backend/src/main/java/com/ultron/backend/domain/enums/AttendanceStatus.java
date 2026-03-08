package com.ultron.backend.domain.enums;

public enum AttendanceStatus {
    PRESENT,       // On time, full day
    LATE,          // Late arrival
    HALF_DAY,      // Incomplete hours
    ABSENT,        // No check-in
    ON_LEAVE,      // Approved leave
    HOLIDAY,       // Public/company holiday
    WEEK_OFF,      // Weekend
    PENDING        // Awaiting regularization
}
