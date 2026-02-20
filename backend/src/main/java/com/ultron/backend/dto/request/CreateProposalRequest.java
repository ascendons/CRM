package com.ultron.backend.dto.request;

import com.ultron.backend.dto.AddressDTO;
import com.ultron.backend.domain.enums.DiscountType;
import com.ultron.backend.domain.enums.GstType;
import com.ultron.backend.domain.enums.ProposalSource;
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
public class CreateProposalRequest {

    @NotNull(message = "Source is required")
    private ProposalSource source;  // LEAD or OPPORTUNITY

    @NotBlank(message = "Source ID is required")
    private String sourceId;  // MongoDB ObjectId of Lead or Opportunity

    @NotBlank(message = "Title is required")
    @Size(min = 2, max = 200, message = "Title must be between 2 and 200 characters")
    private String title;

    @Size(max = 1000, message = "Description must be less than 1000 characters")
    private String description;

    @NotNull(message = "Valid until date is required")
    @ValidUntilConstraint(maxMonths = 12)
    private LocalDate validUntil;

    // Customer Information
    @Valid
    private AddressDTO billingAddress;
    @Valid
    private AddressDTO shippingAddress;

    @NotNull(message = "At least one line item is required")
    @Size(min = 1, message = "At least one line item is required")
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
    private List<PaymentMilestoneDTO> paymentMilestones;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentMilestoneDTO {
        @NotBlank(message = "Milestone name is required")
        private String name;

        @NotNull(message = "Milestone percentage is required")
        @Min(value = 0, message = "Percentage must be greater than or equal to 0")
        @Max(value = 100, message = "Percentage cannot exceed 100")
        private BigDecimal percentage;
    }

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
