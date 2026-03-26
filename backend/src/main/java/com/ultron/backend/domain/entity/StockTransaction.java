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
import java.util.List;

/**
 * Immutable transaction log for all stock movements.
 * Provides complete audit trail for inventory changes.
 */
@Document(collection = "inventory_transactions")
@CompoundIndexes({
    @CompoundIndex(
        name = "tenant_product_time_idx",
        def = "{'tenantId': 1, 'productId': 1, 'timestamp': -1}"
    ),
    @CompoundIndex(
        name = "tenant_warehouse_time_idx",
        def = "{'tenantId': 1, 'warehouseId': 1, 'timestamp': -1}"
    ),
    @CompoundIndex(
        name = "tenant_type_time_idx",
        def = "{'tenantId': 1, 'transactionType': 1, 'timestamp': -1}"
    ),
    @CompoundIndex(
        name = "tenant_reference_idx",
        def = "{'tenantId': 1, 'referenceType': 1, 'referenceId': 1}"
    )
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockTransaction {

    @Id
    private String id;

    @Indexed
    private String transactionId;       // Business ID: TXN-{timestamp}

    @Indexed
    private String tenantId;

    // What
    @Indexed
    private String productId;           // Product involved in transaction

    @Indexed
    private String warehouseId;         // Warehouse where transaction occurred
    private String locationId;          // Specific location (optional)

    // Transaction Type
    @Indexed
    private TransactionType transactionType;

    // Direction
    private Direction direction;        // IN (increase) or OUT (decrease)

    // Quantity
    private Integer quantity;           // Quantity moved
    private Integer quantityBefore;     // Stock level before transaction
    private Integer quantityAfter;      // Stock level after transaction

    // Costing
    private BigDecimal unitCost;        // Cost per unit
    private BigDecimal totalValue;      // quantity * unitCost

    // Reason/Reference
    private String reason;              // Human-readable reason
    private String referenceType;       // PURCHASE_ORDER, SALES_ORDER, ADJUSTMENT, TRANSFER
    private String referenceId;         // ID of source document

    // Batch/Serial Tracking (optional)
    private String batchNumber;         // Batch/lot number if applicable
    private List<String> serialNumbers; // Serial numbers if applicable
    private LocalDateTime expiryDate;   // For batch tracking

    // Timestamp
    @Indexed
    private LocalDateTime timestamp;

    // Audit
    private String recordedBy;          // User ID who recorded transaction
    private String recordedByName;      // User name for display

    /**
     * Transaction types
     */
    public enum TransactionType {
        PURCHASE,           // Received from supplier (PO)
        SALE,               // Sold to customer
        ADJUSTMENT_IN,      // Manual increase (physical count correction)
        ADJUSTMENT_OUT,     // Manual decrease (damage, loss, theft)
        TRANSFER_IN,        // Transfer from another warehouse
        TRANSFER_OUT,       // Transfer to another warehouse
        RETURN_IN,          // Customer return
        RETURN_OUT,         // Return to supplier
        PRODUCTION_IN,      // Manufactured/assembled
        PRODUCTION_OUT,     // Consumed in production/kitting
        DAMAGED,            // Marked as damaged/defective
        EXPIRED,            // Marked as expired (batch tracking)
        RESERVED,           // Reserved for order/quote
        RELEASED            // Reservation released
    }

    /**
     * Direction of stock movement
     */
    public enum Direction {
        IN,     // Increases stock (purchase, adjustment in, transfer in, return)
        OUT     // Decreases stock (sale, adjustment out, transfer out, damage)
    }
}
