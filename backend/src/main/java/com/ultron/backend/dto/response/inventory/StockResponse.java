package com.ultron.backend.dto.response.inventory;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO for stock
 */
@Data
public class StockResponse {

    private String id;
    private String productId;
    private String warehouseId;

    // Product details
    private String productName;      // From Product.productName
    private String catalogProductId; // DynamicProduct.id for viewing in catalog

    // Warehouse details
    private String warehouseName;    // From Warehouse.name
    private String warehouseCode;    // From Warehouse.code

    private Integer quantityOnHand;
    private Integer quantityReserved;
    private Integer quantityAvailable;
    private Integer reorderPoint;
    private Integer reorderQuantity;

    private String costingMethod;
    private BigDecimal unitCost;
    private BigDecimal totalValue;

    private LocalDateTime lastRestockedAt;
    private LocalDateTime createdAt;
}
