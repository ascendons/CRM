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
import java.util.ArrayList;
import java.util.List;

/**
 * Purchase Order for inventory procurement.
 * Tracks orders placed with suppliers and receiving of goods.
 */
@Document(collection = "inventory_purchase_orders")
@CompoundIndexes({
    @CompoundIndex(
        name = "tenant_ponumber_idx",
        def = "{'tenantId': 1, 'poNumber': 1}",
        unique = true
    ),
    @CompoundIndex(
        name = "tenant_status_idx",
        def = "{'tenantId': 1, 'status': 1}"
    ),
    @CompoundIndex(
        name = "tenant_supplier_idx",
        def = "{'tenantId': 1, 'supplierId': 1}"
    )
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrder {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    @Indexed
    private String poNumber;            // PO-2026-0001 (inventory legacy)
    private String tradingPoId;         // Display ref: RKE/26/PO001 (trading flow)

    // Trading source links (null for pure inventory POs)
    @Indexed
    private String sourceProposalId;        // Sales quotation _id
    private String sourceReferenceNumber;   // e.g. RKE/26/P003
    @Indexed
    private String sourceRfqId;             // RFQ _id that originated this PO
    private String rfqReferenceNumber;      // e.g. RKE/26/RFQ002

    // Supplier Information
    private String supplierId;          // Can reference Account from CRM
    private String supplierName;
    private String supplierContact;
    private String supplierEmail;
    private String supplierPhone;

    // Delivery Location
    @Indexed
    private String warehouseId;         // Where goods will be received
    private String warehouseName;

    // Status
    @Indexed
    private POStatus status;

    // Dates
    private LocalDate orderDate;
    private LocalDate expectedDeliveryDate;
    private LocalDate actualDeliveryDate;
    private LocalDate receivedDate;

    // Line Items
    @Builder.Default
    private List<LineItem> items = new ArrayList<>();

    // Financial
    private BigDecimal subtotal;        // Sum of all line items
    private BigDecimal taxAmount;       // Total tax
    private BigDecimal shippingCost;    // Shipping charges
    private BigDecimal totalAmount;     // Grand total

    private String currency;            // INR, USD, etc.

    // Additional Info
    private String notes;
    private String termsAndConditions;
    private String paymentTerms;        // NET30, NET60, etc.

    // Approval
    private String approvedBy;
    private String approvedByName;
    private LocalDateTime approvedAt;
    private String rejectedBy;
    private String rejectedByName;
    private LocalDateTime rejectedAt;
    private String rejectionReason;

    // Multi-level approval workflow (< 50k → L1, 50k-5L → L2, > 5L → L3)
    @Builder.Default
    private List<ApprovalStep> approvalWorkflow = new ArrayList<>();

    // 3-way invoice match
    private String invoiceMatchStatus;      // Pending / Matched / Discrepancy
    private String grnId;
    private String vendorInvoiceNumber;
    private LocalDate vendorInvoiceDate;
    private BigDecimal vendorInvoiceAmount;
    private String paymentStatus;           // Unpaid / PartiallyPaid / Paid
    private LocalDate paymentDueDate;

    // Audit
    private LocalDateTime createdAt;
    private String createdBy;
    private String createdByName;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
    private String lastModifiedByName;

    /**
     * Purchase Order Line Item
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LineItem {
        private String lineItemId;          // Unique ID for this line
        private String productId;           // References DynamicProduct
        private String productName;
        private String sku;
        private String description;

        private Integer orderedQuantity;    // Quantity ordered
        @Builder.Default
        private Integer receivedQuantity = 0;   // Quantity received so far
        private Integer remainingQuantity;  // orderedQuantity - receivedQuantity

        private BigDecimal unitPrice;       // Price per unit
        private BigDecimal taxRate;         // Tax percentage
        private BigDecimal taxAmount;       // Calculated tax
        private BigDecimal totalAmount;     // (unitPrice * orderedQuantity) + taxAmount

        private String uom;                 // Unit of measure
        private String notes;               // Line item specific notes

        // Trading flow — traceability back to source quotation
        private Integer sourceLineItemIndex; // index in source proposal lineItems
        private BigDecimal sellUnitPrice;    // sell price from quotation (margin = sell - unitPrice, admin only)
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApprovalStep {
        private String level;           // L1 / L2 / L3
        private String approverId;
        private String status;          // Pending / Approved / Rejected
        private LocalDateTime approvedAt;
        private String comments;
    }

    /**
     * Purchase Order Status
     */
    public enum POStatus {
        DRAFT,              // Being created
        SUBMITTED,          // Submitted for approval
        APPROVED,           // Approved, ready to send to supplier
        SENT,               // Sent to supplier
        RECEIVING,          // Partially received
        RECEIVED,           // Fully received
        CANCELLED,          // Cancelled before receiving
        CLOSED              // Closed (received or cancelled)
    }
}
