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
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Batch/Lot tracking for products that require it.
 * Common in pharma, FMCG, food, and chemical industries.
 * Enables traceability, expiry management, and recalls.
 */
@Document(collection = "inventory_batches")
@CompoundIndexes({
    @CompoundIndex(
        name = "tenant_product_batch_idx",
        def = "{'tenantId': 1, 'productId': 1, 'batchNumber': 1}",
        unique = true
    ),
    @CompoundIndex(
        name = "tenant_expiry_idx",
        def = "{'tenantId': 1, 'expiryDate': 1, 'status': 1}"
    ),
    @CompoundIndex(
        name = "tenant_warehouse_idx",
        def = "{'tenantId': 1, 'warehouseId': 1}"
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
public class Batch {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    // References
    @Indexed
    private String productId;           // Product this batch belongs to

    @Indexed
    private String warehouseId;         // Where this batch is stored
    private String locationId;          // Specific location

    // Batch Information
    @Indexed
    private String batchNumber;         // Unique batch/lot number
    private String lotNumber;           // Alternative lot number (if different)

    private LocalDate manufacturingDate;
    @Indexed
    private LocalDate expiryDate;
    private Integer shelfLifeDays;      // Days until expiry

    // Quantities
    @Builder.Default
    private Integer quantity = 0;           // Current quantity in this batch

    @Builder.Default
    private Integer quantityReserved = 0;   // Reserved quantity

    @Builder.Default
    private Integer quantityAvailable = 0;  // Available = quantity - reserved

    private Integer originalQuantity;   // Initial quantity when batch was received

    // Costing
    private BigDecimal unitCost;        // Cost per unit for this batch

    // Supplier Information
    private String supplierId;
    private String supplierName;
    private String purchaseOrderId;     // PO that received this batch
    private String grnNumber;           // Goods Receipt Note number

    // Quality Control
    private String qcStatus;            // PENDING, PASSED, FAILED, QUARANTINE
    private LocalDate qcDate;
    private String qcBy;
    private String qcNotes;

    // Status
    @Indexed
    private BatchStatus status;

    // Recall Information
    private Boolean isRecalled;
    private LocalDate recallDate;
    private String recallReason;
    private String recallBy;

    // Additional Info
    private String notes;
    private String certificateNumber;   // Quality certificate number

    // Audit
    private LocalDateTime createdAt;
    private String createdBy;
    private String createdByName;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
    private String lastModifiedByName;

    /**
     * Batch Status
     */
    public enum BatchStatus {
        ACTIVE,         // Normal, available for use
        QUARANTINE,     // Under inspection, not available
        EXPIRED,        // Past expiry date
        RECALLED,       // Recalled by supplier/manufacturer
        DEPLETED,       // Fully consumed (quantity = 0)
        REJECTED        // QC failed
    }
}
