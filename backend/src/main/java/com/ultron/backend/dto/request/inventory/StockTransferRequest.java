package com.ultron.backend.dto.request.inventory;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Request DTO for stock transfer between warehouses
 */
@Data
public class StockTransferRequest {

    @NotBlank(message = "Product ID is required")
    private String productId;

    @NotBlank(message = "From warehouse ID is required")
    private String fromWarehouseId;

    @NotBlank(message = "To warehouse ID is required")
    private String toWarehouseId;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Integer quantity;

    private String reason;
    private String notes;
}
