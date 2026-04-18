package com.ultron.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class CreateRateContractRequest {

    @NotBlank
    private String vendorId;

    @NotEmpty
    private List<LineItemDto> lineItems;

    private LocalDate validFrom;
    private LocalDate validTo;
    private Boolean autoRenew;

    @Data
    public static class LineItemDto {
        private String partId;
        private BigDecimal agreedUnitPrice;
        private Integer minOrderQty;
    }
}
