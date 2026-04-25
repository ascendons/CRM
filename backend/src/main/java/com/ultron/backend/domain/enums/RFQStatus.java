package com.ultron.backend.domain.enums;

public enum RFQStatus {
    DRAFT,              // Being prepared
    SENT,               // Sent to one or more vendors
    RESPONSE_RECEIVED,  // At least one vendor has responded
    ACCEPTED,           // Vendor selected, being converted to PO
    CLOSED,             // Fully converted to PO(s)
    CANCELLED
}
