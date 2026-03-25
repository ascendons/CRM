package com.ultron.backend.dto.request.inventory;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

/**
 * Request DTO for stock adjustment
 */
@Data
public class StockAdjustmentRequest {

    @NotBlank(message = "Product ID is required")
    private String productId;

    @NotBlank(message = "Warehouse ID is required")
    private String warehouseId;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Integer quantity;

    @NotBlank(message = "Direction is required (IN/OUT)")
    private String direction; // IN or OUT

    @NotBlank(message = "Reason is required")
    private String reason;

    private BigDecimal unitCost;
    private String referenceType;
    private String referenceId;
    private String notes;
}
