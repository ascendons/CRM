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

import java.time.LocalDateTime;

/**
 * Stock reservation for quotes, proposals, and orders.
 * Prevents overselling by reserving stock for specific purposes.
 */
@Document(collection = "inventory_reservations")
@CompoundIndexes({
    @CompoundIndex(
        name = "tenant_product_idx",
        def = "{'tenantId': 1, 'productId': 1}"
    ),
    @CompoundIndex(
        name = "tenant_warehouse_idx",
        def = "{'tenantId': 1, 'warehouseId': 1}"
    ),
    @CompoundIndex(
        name = "tenant_reference_idx",
        def = "{'tenantId': 1, 'referenceType': 1, 'referenceId': 1}"
    ),
    @CompoundIndex(
        name = "tenant_expiry_status_idx",
        def = "{'tenantId': 1, 'expiresAt': 1, 'status': 1}"
    ),
    @CompoundIndex(
        name = "tenant_status_idx",
        def = "{'tenantId': 1, 'status': 1}"
    )
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockReservation {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    // What is reserved
    @Indexed
    private String productId;           // Product being reserved

    @Indexed
    private String warehouseId;         // Warehouse where stock is reserved

    private String locationId;          // Specific location (optional)

    private Integer quantity;           // Quantity reserved

    // What this reservation is for
    private String referenceType;       // QUOTE, PROPOSAL, ORDER, MANUAL
    private String referenceId;         // ID of the quote/proposal/order
    private String referenceNumber;     // Business number for display

    // Customer/Contact info (for context)
    private String customerId;
    private String customerName;

    // Status
    @Indexed
    private ReservationStatus status;

    // Expiry
    @Indexed
    private LocalDateTime expiresAt;    // Auto-release after this time

    private Boolean autoReleaseEnabled; // If true, will be auto-released on expiry

    // Fulfillment
    private LocalDateTime fulfilledAt;  // When reservation was converted to actual transaction
    private String fulfilledBy;
    private String fulfilledByName;

    // Notes
    private String notes;
    private String reason;              // Why this reservation was made

    // Audit
    private LocalDateTime createdAt;
    private String createdBy;
    private String createdByName;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
    private String lastModifiedByName;

    /**
     * Reservation Status
     */
    public enum ReservationStatus {
        ACTIVE,         // Currently active reservation
        FULFILLED,      // Converted to actual sale/order
        EXPIRED,        // Expired without being fulfilled
        CANCELLED,      // Manually cancelled
        RELEASED        // Manually released back to available stock
    }
}
