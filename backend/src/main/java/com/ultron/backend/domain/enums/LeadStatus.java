package com.ultron.backend.domain.enums;

public enum LeadStatus {
    NEW,           // Just created, not yet contacted
    CONTACTED,     // First touch made
    QUALIFIED,     // Passed qualification criteria
    PROPOSAL_SENT, // Proposal or quote shared
    NEGOTIATION,   // Discussing terms
    UNQUALIFIED,   // Doesn't meet criteria
    LOST,          // Not interested or chose competitor
    CONVERTED      // Successfully converted to opportunity
}
