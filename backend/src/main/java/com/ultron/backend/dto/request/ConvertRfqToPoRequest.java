package com.ultron.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class ConvertRfqToPoRequest {

    @NotBlank
    private String vendorId;            // Which vendor's response to use

    @NotEmpty
    private List<Integer> lineItemIndexes; // Which RFQ line items to include in the PO

    private LocalDate expectedDeliveryDate;
    private String notes;
    private String paymentTerms;
}
