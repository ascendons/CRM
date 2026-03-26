package com.ultron.backend.dto.response.inventory;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * Response DTO for stock reservation
 */
@Data
public class StockReservationResponse {

    private String id;
    private String productId;
    private String warehouseId;

    private Integer quantity;

    private String referenceType;
    private String referenceId;
    private String referenceNumber;

    private String status;
    private LocalDateTime expiresAt;
    private Boolean autoReleaseEnabled;

    private LocalDateTime fulfilledAt;
    private String fulfilledBy;

    private String notes;

    private LocalDateTime createdAt;
    private String createdBy;
}
