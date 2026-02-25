package com.ultron.backend.domain.enums;

/**
 * Types of invoice templates available for PDF generation
 */
public enum InvoiceTemplateType {
    PROFORMA("Proforma Invoice", "For quotations and proposals before final sale"),
    TAX_INVOICE("Tax Invoice", "GST-compliant invoice for completed sales"),
    COMMERCIAL("Commercial Invoice", "For international trade and customs clearance"),
    MINIMAL("Minimal Invoice", "Clean, simple design for quick invoicing");

    private final String displayName;
    private final String description;

    InvoiceTemplateType(String displayName, String description) {
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
