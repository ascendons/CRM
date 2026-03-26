package com.ultron.backend.dto.request.inventory;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Request DTO for creating a stock reservation
 */
@Data
public class CreateReservationRequest {

    @NotBlank(message = "Product ID is required")
    private String productId;

    @NotBlank(message = "Warehouse ID is required")
    private String warehouseId;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Integer quantity;

    @NotBlank(message = "Reference type is required")
    private String referenceType; // QUOTE, PROPOSAL, ORDER

    @NotBlank(message = "Reference ID is required")
    private String referenceId;

    private String referenceNumber;

    private Integer expiryDays; // Default: 7 days

    private String notes;
}
