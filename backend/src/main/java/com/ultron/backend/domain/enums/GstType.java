package com.ultron.backend.domain.enums;

public enum GstType {
    NONE("None", 0.0, 0.0),
    CGST_SGST_9("CGST+SGST (9+9)", 9.0, 9.0),
    CGST_SGST_2_5("CGST+SGST (2.5+2.5)", 2.5, 2.5),
    IGST_18("IGST (18)", 18.0, 0.0),
    IGST_5("IGST (5)", 5.0, 0.0);

    private final String displayName;
    private final double primaryRate;
    private final double secondaryRate;

    GstType(String displayName, double primaryRate, double secondaryRate) {
        this.displayName = displayName;
        this.primaryRate = primaryRate;
        this.secondaryRate = secondaryRate;
    }

    public String getDisplayName() { return displayName; }
    public double getPrimaryRate() { return primaryRate; }
    public double getSecondaryRate() { return secondaryRate; }
    public double getTotalRate() { return primaryRate + secondaryRate; }
    public boolean isGstEnabled() { return this != NONE; }
}
