package com.ultron.backend.dto.response;

import com.ultron.backend.domain.entity.Proposal;
import com.ultron.backend.domain.enums.DiscountType;
import com.ultron.backend.domain.enums.GstType;
import com.ultron.backend.domain.enums.ProposalSource;
import com.ultron.backend.domain.enums.ProposalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProposalResponse {
    private String id;
    private String proposalId;

    // Source
    private ProposalSource source;
    private String sourceId;
    private String sourceName;

    // Explicit links for cross-referencing
    private String leadId;
    private String leadName;
    private String opportunityId;
    private String opportunityName;
    private String accountId;
    private String accountName;
    private String contactId;
    private String contactName;

    // Customer
    private String customerId;
    private String companyName;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private Proposal.CustomerAddress billingAddress;
    private Proposal.CustomerAddress shippingAddress;

    // Proposal Details
    private String proposalNumber;
    private String title;
    private String description;
    private LocalDate validUntil;

    // Line Items
    private List<Proposal.ProposalLineItem> lineItems;

    // Discount & Tax
    private Proposal.DiscountConfig discount;
    private GstType gstType;
    private String gstNumber;

    // Milestones
    private List<Proposal.PaymentMilestone> paymentMilestones;
    private Integer currentMilestoneIndex;
    private Boolean isProforma;
    private String parentProposalId;

    // Totals
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;

    // Status
    private ProposalStatus status;
    private LocalDateTime sentAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime rejectedAt;
    private String rejectionReason;

    // Owner
    private String ownerId;
    private String ownerName;

    // Terms
    private String paymentTerms;
    private String deliveryTerms;
    private String notes;

    // Audit
    private LocalDateTime createdAt;
    private String createdBy;
    private String createdByName;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
    private String lastModifiedByName;
}
