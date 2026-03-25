package com.ultron.backend.dto.response.inventory;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO for batch/lot
 */
@Data
public class BatchResponse {

    private String id;
    private String productId;
    private String warehouseId;

    private String batchNumber;
    private LocalDate manufacturingDate;
    private LocalDate expiryDate;
    private Integer shelfLifeDays;

    private Integer quantity;
    private Integer quantityReserved;
    private Integer quantityAvailable;
    private Integer originalQuantity;

    private String status;

    private String supplierId;
    private String supplierName;

    private String qcStatus;
    private LocalDate qcDate;
    private String qcBy;
    private String qcNotes;

    private Boolean isRecalled;
    private LocalDate recallDate;
    private String recallReason;
    private String recallBy;

    private LocalDateTime createdAt;
    private String createdBy;
}
