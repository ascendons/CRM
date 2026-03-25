package com.ultron.backend.dto.response.inventory;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO for stock transaction
 */
@Data
public class StockTransactionResponse {

    private String id;
    private String transactionId;
    private String transactionType;
    private String direction;

    private String productId;
    private String warehouseId;

    private Integer quantity;
    private Integer quantityBefore;
    private Integer quantityAfter;
    private BigDecimal unitCost;
    private BigDecimal totalValue;

    private String reason;
    private String referenceType;
    private String referenceId;

    private LocalDateTime timestamp;
    private String recordedBy;
}
