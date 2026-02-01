package com.ultron.backend.domain.enums;

import lombok.Getter;

@Getter
public enum ProposalSource {
    LEAD("Lead"),
    OPPORTUNITY("Opportunity");

    private final String displayName;

    ProposalSource(String displayName) {
        this.displayName = displayName;
    }
}
