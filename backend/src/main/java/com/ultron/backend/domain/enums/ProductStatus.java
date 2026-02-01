package com.ultron.backend.domain.enums;

import lombok.Getter;

@Getter
public enum ProductStatus {
    ACTIVE("Active"),
    DISCONTINUED("Discontinued"),
    OUT_OF_STOCK("Out of Stock"),
    DRAFT("Draft");

    private final String displayName;

    ProductStatus(String displayName) {
        this.displayName = displayName;
    }
}
