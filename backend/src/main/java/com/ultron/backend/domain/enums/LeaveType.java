package com.ultron.backend.domain.enums;

/**
 * Enum representing different types of leaves
 */
public enum LeaveType {
    SICK("Sick Leave", "Medical or health-related leave"),
    CASUAL("Casual Leave", "Short-term leave for personal reasons"),
    EARNED("Earned Leave", "Privileged leave earned through service"),
    PAID("Paid Leave", "General paid time off"),
    UNPAID("Unpaid Leave", "Leave without pay"),
    MATERNITY("Maternity Leave", "Leave for childbirth and post-natal care"),
    PATERNITY("Paternity Leave", "Leave for fathers during childbirth"),
    COMPENSATORY("Compensatory Off", "Compensatory leave for overtime work"),
    BEREAVEMENT("Bereavement Leave", "Leave due to death in family"),
    MARRIAGE("Marriage Leave", "Leave for wedding");

    private final String displayName;
    private final String description;

    LeaveType(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }
}
