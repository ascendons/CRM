package com.ultron.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Stock level for a product at a specific warehouse.
 * Core inventory tracking entity.
 */
@Document(collection = "inventory_stock")
@CompoundIndexes({
    @CompoundIndex(
        name = "tenant_product_warehouse_idx",
        def = "{'tenantId': 1, 'productId': 1, 'warehouseId': 1}",
        unique = true
    ),
    @CompoundIndex(
        name = "tenant_product_idx",
        def = "{'tenantId': 1, 'productId': 1}"
    ),
    @CompoundIndex(
        name = "tenant_warehouse_idx",
        def = "{'tenantId': 1, 'warehouseId': 1}"
    ),
    @CompoundIndex(
        name = "tenant_lowstock_idx",
        def = "{'tenantId': 1, 'quantityAvailable': 1, 'reorderPoint': 1}"
    )
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Stock {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    // References
    @Indexed
    private String productId;           // References DynamicProduct.productId

    @Indexed
    private String warehouseId;         // References Warehouse.id

    private String locationId;          // Optional: specific bin/rack/aisle

    // Quantities
    @Builder.Default
    private Integer quantityOnHand = 0;      // Physical stock count

    @Builder.Default
    private Integer quantityReserved = 0;    // Reserved for orders/quotes

    @Builder.Default
    private Integer quantityAvailable = 0;   // Available = OnHand - Reserved

    @Builder.Default
    private Integer quantityOnOrder = 0;     // Incoming from purchase orders

    @Builder.Default
    private Integer quantityDamaged = 0;     // Damaged/defective units

    // Stock Level Thresholds (Alert Triggers)
    private Integer reorderPoint;            // Alert when available < this
    private Integer reorderQuantity;         // Suggested order quantity
    private Integer minimumLevel;            // Absolute minimum stock
    private Integer maximumLevel;            // Maximum capacity

    // Costing
    private String costingMethod;            // FIFO, LIFO, WEIGHTED_AVG, STANDARD
    private BigDecimal unitCost;             // Current average unit cost
    private BigDecimal totalValue;           // quantityOnHand * unitCost

    // Timestamps
    private LocalDateTime lastRestockedAt;   // Last time stock was added
    private LocalDateTime lastCountedAt;     // Last physical count date
    private LocalDateTime lastMovementAt;    // Last transaction timestamp

    // Audit
    private LocalDateTime createdAt;
    private String createdBy;
    private String createdByName;
    private LocalDateTime updatedAt;
    private String updatedBy;
    private String updatedByName;
}
