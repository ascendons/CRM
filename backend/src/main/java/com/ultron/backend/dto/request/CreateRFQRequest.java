package com.ultron.backend.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class CreateRFQRequest {

    private String title;

    // Source document (null = standalone RFQ)
    private String sourceType;  // QUOTATION | PROFORMA | STANDALONE
    private String sourceId;    // Proposal _id

    @NotEmpty(message = "At least one item required")
    private List<RFQItemDto> items;

    @NotEmpty(message = "At least one vendor required")
    private List<String> vendorIds;

    private LocalDate deadline;
    private String notes;

    // If true, mark as SENT immediately after creation
    private boolean sendImmediately;

    @Data
    public static class RFQItemDto {
        private int    sourceLineItemIndex; // index in proposal lineItems (-1 for standalone)
        private String productId;
        private String productName;
        private String description;
        private BigDecimal requestedQty;
        private String unit;
        private BigDecimal targetPrice;
        private BigDecimal sellUnitPrice;   // from source quotation
    }
}
