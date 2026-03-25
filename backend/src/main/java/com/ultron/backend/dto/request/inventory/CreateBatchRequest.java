package com.ultron.backend.dto.request.inventory;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/**
 * Request DTO for creating a batch/lot
 */
@Data
public class CreateBatchRequest {

    @NotBlank(message = "Product ID is required")
    private String productId;

    @NotBlank(message = "Warehouse ID is required")
    private String warehouseId;

    @NotBlank(message = "Batch number is required")
    private String batchNumber;

    private LocalDate manufacturingDate;

    @NotNull(message = "Expiry date is required")
    private LocalDate expiryDate;

    private Integer quantity;
    private String supplierId;
    private String supplierName;
    private String qcStatus;
    private LocalDate qcDate;
    private String qcNotes;
}
