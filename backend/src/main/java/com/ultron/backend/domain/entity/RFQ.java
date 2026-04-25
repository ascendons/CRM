package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.RFQStatus;
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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "rfqs")
@CompoundIndexes({
    @CompoundIndex(name = "tenant_status_idx",    def = "{'tenantId': 1, 'status': 1}"),
    @CompoundIndex(name = "tenant_source_idx",    def = "{'tenantId': 1, 'sourceId': 1}"),
    @CompoundIndex(name = "tenant_vendor_idx",    def = "{'tenantId': 1, 'vendorIds': 1}"),
    @CompoundIndex(name = "tenant_rfqid_unique",  def = "{'tenantId': 1, 'rfqId': 1}", unique = true, sparse = true)
})
public class RFQ {

    @Id
    private String id;

    // Display reference: RKE/26/RFQ001
    private String rfqId;

    @Indexed
    private String tenantId;

    // Source document link
    private String sourceType;          // QUOTATION | PROFORMA | STANDALONE
    private String sourceId;            // Proposal MongoDB _id
    private String sourceReferenceNumber; // e.g. RKE/26/P003 (for display)

    private String title;
    private String description;

    // Items requested — each traces back to a source quotation line item
    private List<RFQItem> items;

    // Vendors this RFQ is sent to (one or many)
    private List<String> vendorIds;
    private List<String> vendorNames;

    private LocalDate deadline;

    // Per-vendor responses (one entry per vendor who responded)
    private List<VendorResponse> responses;

    // After comparing responses, the chosen vendor
    private String selectedVendorId;
    private String selectedVendorName;

    private RFQStatus status;

    private String notes;

    // Audit
    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private String createdByName;
    private LocalDateTime updatedAt;
    private String updatedBy;

    // ── Inner types ──────────────────────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RFQItem {
        private int    sourceLineItemIndex; // index into source proposal lineItems list
        private String productId;
        private String productName;
        private String description;
        private BigDecimal requestedQty;
        private String unit;
        private BigDecimal targetPrice;     // optional ceiling price
        private BigDecimal sellUnitPrice;   // from source quotation (for margin — admin only)
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VendorResponse {
        private String vendorId;
        private String vendorName;
        private List<LineQuote> lineQuotes; // per-item quoted prices
        private Integer deliveryDays;
        private String notes;
        private LocalDateTime respondedAt;
        private boolean selected;           // true if this vendor was chosen
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LineQuote {
        private int    sourceLineItemIndex; // matches RFQItem.sourceLineItemIndex
        private BigDecimal quotedUnitPrice;
        private BigDecimal quotedQty;       // vendor may quote partial qty
    }
}
