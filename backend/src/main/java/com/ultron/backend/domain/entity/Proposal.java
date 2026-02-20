package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.DiscountType;
import com.ultron.backend.domain.enums.GstType;
import com.ultron.backend.domain.enums.ProposalSource;
import com.ultron.backend.domain.enums.ProposalStatus;
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
import java.util.List;

@Document(collection = "proposals")
@CompoundIndexes({
    @CompoundIndex(name = "tenant_deleted_idx", def = "{'tenantId': 1, 'isDeleted': 1}"),
    @CompoundIndex(name = "tenant_source_deleted_idx", def = "{'tenantId': 1, 'source': 1, 'sourceId': 1, 'isDeleted': 1}"),
    @CompoundIndex(name = "tenant_lead_idx", def = "{'tenantId': 1, 'leadId': 1, 'isDeleted': 1}"),
    @CompoundIndex(name = "tenant_opportunity_idx", def = "{'tenantId': 1, 'opportunityId': 1, 'isDeleted': 1}"),
    @CompoundIndex(name = "tenant_account_idx", def = "{'tenantId': 1, 'accountId': 1, 'isDeleted': 1}"),
    @CompoundIndex(name = "tenant_status_deleted_idx", def = "{'tenantId': 1, 'status': 1, 'isDeleted': 1}"),
    @CompoundIndex(name = "tenant_owner_deleted_idx", def = "{'tenantId': 1, 'ownerId': 1, 'isDeleted': 1}"),
    @CompoundIndex(name = "tenant_status_source_idx", def = "{'tenantId': 1, 'status': 1, 'source': 1, 'sourceId': 1}"),
    @CompoundIndex(name = "tenant_product_lineitem_idx", def = "{'tenantId': 1, 'lineItems.productId': 1, 'isDeleted': 1}")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Proposal {
    @Id
    private String id;

    @Indexed(unique = true)
    private String proposalId;  // Business ID: PROP-YYYY-MM-XXXXX

    // Multi-tenancy
    @Indexed
    private String tenantId;

    // Link to Lead or Opportunity (Legacy polymorphic link)
    @Indexed
    private ProposalSource source;  // LEAD or OPPORTUNITY
    @Indexed
    private String sourceId;  // MongoDB ObjectId of Lead or Opportunity
    private String sourceName;  // Denormalized: Lead/Opportunity name

    // Explicit links for cross-referencing
    @Indexed
    private String leadId;
    private String leadName;

    @Indexed
    private String opportunityId;
    private String opportunityName;

    @Indexed
    private String accountId;
    private String accountName;

    @Indexed
    private String contactId;
    private String contactName;

    // Customer Information (denormalized for proposal history)
    private String customerId;  // MongoDB ObjectId of Account (Legacy - use accountId)
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private CustomerAddress billingAddress;
    private CustomerAddress shippingAddress;

    // Proposal Details
    private String proposalNumber;  // User-friendly: same as proposalId
    private String title;
    private String description;
    private LocalDate validUntil;  // Expiry date

    // Line Items
    private List<ProposalLineItem> lineItems;

    // Discount Configuration
    private DiscountConfig discount;
    private GstType gstType;

    // Calculated Totals
    private BigDecimal subtotal;  // Sum of line items before discount
    private BigDecimal discountAmount;  // Total discount applied
    private BigDecimal taxAmount;  // Total tax amount
    private BigDecimal totalAmount;  // Final amount after discount and tax

    // Workflow
    @Indexed
    private ProposalStatus status;  // DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED
    private LocalDateTime sentAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime rejectedAt;
    private String rejectionReason;

    // Owner
    @Indexed
    private String ownerId;
    private String ownerName;

    // Terms & Conditions
    private String paymentTerms;
    private String deliveryTerms;
    private String notes;

    // Audit
    private Boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private String createdByName;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
    private String lastModifiedByName;

    // Milestones
    private List<PaymentMilestone> paymentMilestones;
    @Builder.Default
    private Integer currentMilestoneIndex = 0;
    private String parentProposalId;

    // Embedded Classes

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentMilestone {
        private String name;
        private BigDecimal percentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProposalLineItem {
        private String lineItemId;  // UUID
        private String productId;  // Reference to Product
        private String productName;  // Denormalized
        private String sku;  // Denormalized
        private String description;

        private Integer quantity;
        private String unit;
        private String hsnCode;
        private BigDecimal unitPrice;  // Price per unit
        private BigDecimal taxRate;  // Percentage

        // Line-item discount
        private DiscountType discountType;  // PERCENTAGE or FIXED_AMOUNT
        private BigDecimal discountValue;  // Discount amount or percentage

        // Calculated fields
        private BigDecimal lineSubtotal;  // quantity * unitPrice
        private BigDecimal lineDiscountAmount;  // Calculated discount
        private BigDecimal lineTaxAmount;  // Calculated tax
        private BigDecimal lineTotal;  // Final line total
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiscountConfig {
        private DiscountType overallDiscountType;  // PERCENTAGE or FIXED_AMOUNT
        private BigDecimal overallDiscountValue;
        private String discountReason;  // Optional: "Early bird discount", "Bulk order"
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerAddress {
        private String street;
        private String city;
        private String state;
        private String postalCode;
        private String country;
    }
}
