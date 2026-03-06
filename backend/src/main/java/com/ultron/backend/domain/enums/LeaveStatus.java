package com.ultron.backend.domain.enums;

/**
 * Enum representing leave request status
 */
public enum LeaveStatus {
    PENDING("Pending Approval", "Leave request is awaiting manager approval"),
    APPROVED("Approved", "Leave request has been approved"),
    REJECTED("Rejected", "Leave request has been rejected"),
    CANCELLED("Cancelled", "Leave request has been cancelled by employee"),
    WITHDRAWN("Withdrawn", "Leave request has been withdrawn");

    private final String displayName;
    private final String description;

    LeaveStatus(String displayName, String description) {
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
