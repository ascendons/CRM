package com.ultron.backend.domain.enums;

/**
 * Enum representing half-day leave types
 */
public enum HalfDayType {
    FIRST_HALF("First Half", "Leave for first half of the day (morning)"),
    SECOND_HALF("Second Half", "Leave for second half of the day (afternoon)");

    private final String displayName;
    private final String description;

    HalfDayType(String displayName, String description) {
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
