package com.ultron.backend.domain.enums;

import lombok.Getter;

@Getter
public enum ProposalStatus {
    DRAFT("Draft"),
    SENT("Sent"),
    ACCEPTED("Accepted"),
    REJECTED("Rejected"),
    EXPIRED("Expired");

    private final String displayName;

    ProposalStatus(String displayName) {
        this.displayName = displayName;
    }
}
