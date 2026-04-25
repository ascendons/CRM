package com.ultron.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class RecordVendorResponseRequest {

    @NotBlank
    private String vendorId;

    @NotEmpty
    private List<LineQuoteDto> lineQuotes;

    private Integer deliveryDays;
    private String notes;

    @Data
    public static class LineQuoteDto {
        private int sourceLineItemIndex;
        private BigDecimal quotedUnitPrice;
        private BigDecimal quotedQty;
    }
}
