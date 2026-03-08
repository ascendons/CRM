package com.ultron.backend.domain.enums;

/**
 * Enum representing regularization request status
 */
public enum RegularizationStatus {
    PENDING("Pending Approval", "Awaiting manager approval"),
    APPROVED("Approved", "Regularization approved and applied"),
    REJECTED("Rejected", "Regularization rejected"),
    AUTO_APPROVED("Auto Approved", "Automatically approved by system");

    private final String displayName;
    private final String description;

    RegularizationStatus(String displayName, String description) {
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
