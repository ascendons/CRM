package com.ultron.backend.dto.request.inventory;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Request DTO for creating a purchase order
 */
@Data
public class CreatePurchaseOrderRequest {

    @NotBlank(message = "Supplier ID is required")
    private String supplierId;

    private String supplierName;
    private String supplierContact;
    private String supplierEmail;
    private String supplierPhone;

    @NotBlank(message = "Warehouse ID is required")
    private String warehouseId;

    private String warehouseName;

    private LocalDate orderDate;
    private LocalDate expectedDeliveryDate;

    @NotEmpty(message = "At least one line item is required")
    private List<LineItemRequest> items;

    private BigDecimal shippingCost;
    private String paymentTerms;
    private String notes;
    private String termsAndConditions;

    @Data
    public static class LineItemRequest {

        @NotBlank(message = "Product ID is required")
        private String productId;

        private String productName;

        @NotNull(message = "Ordered quantity is required")
        @Positive(message = "Ordered quantity must be positive")
        private Integer orderedQuantity;

        @NotNull(message = "Unit price is required")
        private BigDecimal unitPrice;

        private BigDecimal taxRate;
        private String notes;
    }
}
