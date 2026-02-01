package com.ultron.backend.domain.enums;

import lombok.Getter;

@Getter
public enum DiscountType {
    PERCENTAGE("Percentage"),
    FIXED_AMOUNT("Fixed Amount");

    private final String displayName;

    DiscountType(String displayName) {
        this.displayName = displayName;
    }
}
