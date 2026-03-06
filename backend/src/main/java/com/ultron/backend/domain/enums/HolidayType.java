package com.ultron.backend.domain.enums;

/**
 * Enum representing types of holidays
 */
public enum HolidayType {
    NATIONAL("National Holiday", "Public holiday observed nationally"),
    REGIONAL("Regional Holiday", "Holiday specific to a state/region"),
    OPTIONAL("Optional Holiday", "Optional holiday - employees can choose"),
    COMPANY_SPECIFIC("Company Specific", "Specific to company policy");

    private final String displayName;
    private final String description;

    HolidayType(String displayName, String description) {
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
