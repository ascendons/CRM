package com.ultron.backend.domain.enums;

/**
 * Enum representing types of attendance regularization requests
 */
public enum RegularizationType {
    MISSED_CHECKIN("Missed Check-in", "Forgot to check in"),
    MISSED_CHECKOUT("Missed Check-out", "Forgot to check out"),
    WRONG_LOCATION("Wrong Location", "Checked in/out at wrong location"),
    LATE_ARRIVAL("Late Arrival", "Request to mark late arrival as on-time"),
    EARLY_LEAVE("Early Leave", "Left early due to emergency"),
    FORGOT_CHECKOUT("Forgot Check-out", "Forgot to check out at end of day"),
    SYSTEM_ERROR("System Error", "System error during check-in/out"),
    WRONG_TIME("Wrong Time", "Incorrect time recorded"),
    OTHER("Other", "Other regularization reason");

    private final String displayName;
    private final String description;

    RegularizationType(String displayName, String description) {
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
