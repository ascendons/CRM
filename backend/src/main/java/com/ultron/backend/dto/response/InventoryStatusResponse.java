package com.ultron.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response containing inventory status for a catalog product
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryStatusResponse {

    /**
     * Whether inventory tracking is enabled for this product
     */
    private boolean inventoryTracked;

    /**
     * Reference to the structured product (if tracked)
     */
    private String structuredProductId;

    /**
     * Product SKU (if tracked)
     */
    private String sku;

    // Stock information
    private Integer onHandStock;        // Physical stock in warehouse
    private Integer reservedStock;      // Stock held for orders/quotes
    private Integer availableStock;     // onHand - reserved
    private Integer minStockLevel;
    private Integer reorderLevel;

    /**
     * Stock status flags
     */
    private boolean isLowStock;         // availableStock <= reorderLevel
    private boolean isOutOfStock;       // availableStock == 0
    private boolean needsReorder;       // availableStock <= reorderLevel

    /**
     * Warehouse information
     */
    private String warehouseId;
    private String warehouseName;

    /**
     * Pricing information (if available)
     */
    private BigDecimal basePrice;
    private BigDecimal listPrice;
    private String currency;

    /**
     * Sync information
     */
    private String syncStatus;
    private String lastSyncedAt;

    /**
     * Create response for non-tracked product
     */
    public static InventoryStatusResponse notTracked() {
        return InventoryStatusResponse.builder()
            .inventoryTracked(false)
            .build();
    }
}
