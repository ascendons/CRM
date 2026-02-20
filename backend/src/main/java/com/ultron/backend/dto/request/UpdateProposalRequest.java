package com.ultron.backend.dto.request;

import com.ultron.backend.dto.AddressDTO;
import com.ultron.backend.domain.enums.DiscountType;
import com.ultron.backend.domain.enums.GstType;
import com.ultron.backend.domain.enums.ProposalStatus;
import com.ultron.backend.validation.ValidUntilConstraint;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProposalRequest {

    @Size(min = 2, max = 200, message = "Title must be between 2 and 200 characters")
    private String title;

    @Size(max = 1000, message = "Description must be less than 1000 characters")
    private String description;

    private ProposalStatus status;

    @ValidUntilConstraint(maxMonths = 12)
    private LocalDate validUntil;

    // Customer Information
    @Valid
    private AddressDTO billingAddress;
    @Valid
    private AddressDTO shippingAddress;

    @Valid
    private List<LineItemDTO> lineItems;

    @Valid
    private DiscountConfigDTO discount;

    private GstType gstType;

    @Size(max = 500, message = "Payment terms must be less than 500 characters")
    private String paymentTerms;

    @Size(max = 500, message = "Delivery terms must be less than 500 characters")
    private String deliveryTerms;

    @Size(max = 1000, message = "Notes must be less than 1000 characters")
    private String notes;

    @Valid
    private List<CreateProposalRequest.PaymentMilestoneDTO> paymentMilestones;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LineItemDTO {
        @NotBlank(message = "Product ID is required")
        private String productId;

        @Size(max = 500, message = "Description must be less than 500 characters")
        private String description;

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        private Integer quantity;

        // Optional: Override product's base price
        @Positive(message = "Unit price must be positive")
        private BigDecimal unitPrice;

        // Optional: Line-item discount
        private DiscountType discountType;

        @PositiveOrZero(message = "Discount value must be positive or zero")
        private BigDecimal discountValue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiscountConfigDTO {
        private DiscountType overallDiscountType;

        @PositiveOrZero(message = "Overall discount value must be positive or zero")
        private BigDecimal overallDiscountValue;

        @Size(max = 200, message = "Discount reason must be less than 200 characters")
        private String discountReason;
    }
}
