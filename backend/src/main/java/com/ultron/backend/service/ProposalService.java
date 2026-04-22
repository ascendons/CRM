package com.ultron.backend.service;

import com.ultron.backend.domain.entity.*;
import com.ultron.backend.domain.enums.ProposalSource;
import com.ultron.backend.domain.enums.ProposalStatus;
import com.ultron.backend.domain.enums.UserRole;
import com.ultron.backend.dto.AddressDTO;
import com.ultron.backend.dto.request.CreateProposalRequest;
import com.ultron.backend.dto.request.UpdateProposalRequest;
import com.ultron.backend.dto.response.ProposalResponse;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.LeadRepository;
import com.ultron.backend.repository.OpportunityRepository;
import com.ultron.backend.repository.ProductRepository;
import com.ultron.backend.repository.ProposalRepository;
import com.ultron.backend.repository.UserRepository;
import com.ultron.backend.repository.DynamicProductRepository;
import com.ultron.backend.repository.AuditLogRepository;
import com.ultron.backend.domain.entity.DynamicProduct.ProductAttribute;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProposalService extends BaseTenantService {

    private final ProposalRepository proposalRepository;
    private final ProposalIdGeneratorService proposalIdGeneratorService;
    private final ProposalCalculationService calculationService;
    private final ProductRepository productRepository;
    private final LeadRepository leadRepository;
    private final OpportunityRepository opportunityRepository;
    private final DynamicProductRepository dynamicProductRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final PdfService pdfService;
    private final InvoiceTemplateService invoiceTemplateService;
    private final com.ultron.backend.repository.OrganizationRepository organizationRepository;
    private final AuditLogRepository auditLogRepository;
    private final ProposalVersioningService proposalVersioningService;
    private final NotificationService notificationService;

    @Transactional
    public ProposalResponse createProposal(CreateProposalRequest request, String createdBy) {
        // Get current tenant ID for multi-tenancy
        String tenantId = getCurrentTenantId();

        log.info("[Tenant: {}] Creating proposal from source: {} - {}", tenantId, request.getSource(), request.getSourceId());

        // Validate source (Lead or Opportunity)
        validateSource(request.getSource(), request.getSourceId(), tenantId);

        // Get source name
        String sourceName = getSourceName(request.getSource(), request.getSourceId(), tenantId);

        // Build line items with product validation
        List<Proposal.ProposalLineItem> lineItems = this.buildCreateLineItems(request.getLineItems(), tenantId);

        // Build discount config
        Proposal.DiscountConfig discount = null;
        if (request.getDiscount() != null && request.getDiscount().getOverallDiscountType() != null) {
            discount = Proposal.DiscountConfig.builder()
                    .overallDiscountType(request.getDiscount().getOverallDiscountType())
                    .overallDiscountValue(request.getDiscount().getOverallDiscountValue())
                    .discountReason(request.getDiscount().getDiscountReason())
                    .build();
        }

        // Generate proposal ID
        String proposalId = proposalIdGeneratorService.generateProposalId();

        // Build proposal
        Proposal proposal = Proposal.builder()
                .proposalId(proposalId)
                .tenantId(tenantId)  // CRITICAL: Set tenant ID for data isolation
                .source(request.getSource())
                .sourceId(request.getSourceId())
                .sourceName(sourceName)
                .proposalNumber(proposalId)  // Same as proposalId for now
                .title(request.getTitle())
                .description(request.getDescription())
                .validUntil(request.getValidUntil())
                .companyName(request.getCompanyName())
                .customerName(request.getCustomerName())
                .customerEmail(request.getCustomerEmail())
                .customerPhone(request.getCustomerPhone())
                .billingAddress(mapToAddress(request.getBillingAddress()))
                .shippingAddress(mapToAddress(request.getShippingAddress()))
                .lineItems(lineItems)
                .discount(discount)
                .gstType(request.getGstType() != null ? request.getGstType() : com.ultron.backend.domain.enums.GstType.NONE)
                .gstNumber(request.getGstNumber())
                .paymentMilestones(mapMilestones(request.getPaymentMilestones()))
                .currentMilestoneIndex(0)
                .isProforma(request.getIsProforma() != null ? request.getIsProforma() : false)
                .isTechnicalQuotation(request.getIsTechnicalQuotation() != null ? request.getIsTechnicalQuotation() : false)
                .showDiscount(request.getShowDiscount() != null ? request.getShowDiscount() : true)
                .approverIds(request.getApproverIds() != null ? request.getApproverIds() : List.of())
                .approvedByIds(List.of())
                .status(ProposalStatus.DRAFT)
                .ownerId(createdBy)
                .ownerName(getUserName(createdBy))
                .paymentTerms(request.getPaymentTerms())
                .deliveryTerms(request.getDeliveryTerms())
                .notes(request.getNotes())
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(createdBy)
                .createdByName(getUserName(createdBy))
                .build();

        // Populate explicit linkage fields based on source
        if (proposal.getSource() == ProposalSource.LEAD) {
            Lead lead = leadRepository.findById(request.getSourceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lead not found: " + request.getSourceId()));
            proposal.setLeadId(lead.getId());
            proposal.setLeadName(lead.getFirstName() + " " + lead.getLastName());
            
            // If lead is already converted, link to those entities too
            if (lead.getConvertedToAccountId() != null) {
                proposal.setAccountId(lead.getConvertedToAccountId());
            }
            if (lead.getConvertedToOpportunityId() != null) {
                proposal.setOpportunityId(lead.getConvertedToOpportunityId());
            }
            if (lead.getConvertedToContactId() != null) {
                proposal.setContactId(lead.getConvertedToContactId());
            }
        } else if (proposal.getSource() == ProposalSource.OPPORTUNITY) {
            Opportunity opportunity = opportunityRepository.findById(request.getSourceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found: " + request.getSourceId()));
            proposal.setOpportunityId(opportunity.getId());
            proposal.setOpportunityName(opportunity.getOpportunityName());
            proposal.setAccountId(opportunity.getAccountId());
            proposal.setContactId(opportunity.getPrimaryContactId());
            
            // Link to original lead if it exists
            if (opportunity.getConvertedFromLeadId() != null) {
                proposal.setLeadId(opportunity.getConvertedFromLeadId());
            }
        }

        // Calculate totals
        proposal = calculationService.calculateTotals(proposal);

        // Save
        Proposal saved = proposalRepository.save(proposal);

        log.info("[Tenant: {}] Proposal created: proposalId={}, source={}, sourceId={}, total={}",
                 tenantId, saved.getProposalId(), saved.getSource(), saved.getSourceId(), saved.getTotalAmount());

        // Log creation audit
        auditLogService.logAsync("PROPOSAL", saved.getId(), saved.getTitle(),
                "CREATE", "Proposal created",
                null, saved.getStatus().toString(),
                createdBy, null);

        // Create version snapshot
        proposalVersioningService.createSnapshot(saved, "CREATED", "Initial version created", createdBy);

        // P1 #14: Notify proposal owner about creation
        if (saved.getOwnerId() != null) {
            try {
                String amountInfo = saved.getTotalAmount() != null ? " (Amount: ₹" + saved.getTotalAmount() + ")" : "";
                notificationService.createAndSendNotification(
                    saved.getOwnerId(),
                    "New Proposal Created: " + saved.getProposalId(),
                    "Proposal '" + saved.getTitle() + "' has been created for " + saved.getSourceName() + amountInfo,
                    "PROPOSAL_CREATED",
                    "/proposals/" + saved.getId()
                );
                log.info("Notification sent for new proposal: {}", saved.getProposalId());
            } catch (Exception e) {
                log.error("Failed to send notification for proposal creation: {}", saved.getProposalId(), e);
            }
        }

        // Sync opportunity amount if applicable
        if (saved.getOpportunityId() != null) {
            syncOpportunityAmount(saved.getOpportunityId());
        }

        return mapToResponse(saved);
    }

    /**
     * Syncs the opportunity amount with the latest relevant proposal value.
     * Priority: ACCEPTED > SENT/NEGOTIATION/REJECTED > DRAFT (whichever is latest modified)
     */
    private void syncOpportunityAmount(String opportunityId) {
        String tenantId = getCurrentTenantId();
        List<Proposal> proposals = proposalRepository.findByOpportunityIdAndTenantIdAndIsDeletedFalse(opportunityId, tenantId);
        
        if (proposals.isEmpty()) return;

        // Find the best proposal to use for the amount
        Proposal bestProposal = proposals.stream()
                .sorted((p1, p2) -> {
                    // Status priority
                    int s1 = getStatusPriority(p1.getStatus());
                    int s2 = getStatusPriority(p2.getStatus());
                    if (s1 != s2) return Integer.compare(s1, s2);
                    
                    // Latest modified priority
                    LocalDateTime m1 = p1.getLastModifiedAt() != null ? p1.getLastModifiedAt() : p1.getCreatedAt();
                    LocalDateTime m2 = p2.getLastModifiedAt() != null ? p2.getLastModifiedAt() : p2.getCreatedAt();
                    return m2.compareTo(m1);
                })
                .findFirst()
                .orElse(null);

        if (bestProposal != null) {
            opportunityRepository.findById(opportunityId).ifPresent(opp -> {
                log.info("[Tenant: {}] Syncing opportunity {} amount to ₹{} from proposal {}", 
                        tenantId, opportunityId, bestProposal.getTotalAmount(), bestProposal.getProposalId());
                opp.setAmount(bestProposal.getTotalAmount());
                opportunityRepository.save(opp);
            });
        }
    }

    private int getStatusPriority(ProposalStatus status) {
        return switch (status) {
            case ACCEPTED -> 1;
            case PENDING_ON_CUSTOMER -> 2;
            case PENDING_APPROVAL -> 3;
            case SENT -> 4;
            case REJECTED -> 5;
            case DRAFT -> 6;
            case EXPIRED -> 7;
            case VOIDED -> 8;
        };
    }

    @Transactional(readOnly = true)
    public byte[] generatePdf(String id) {
        String tenantId = getCurrentTenantId();
        Proposal proposal = findProposalById(id, tenantId);
        try {
            return pdfService.generateProposalPdf(proposal);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }

    /**
     * Generate invoice HTML preview using template
     * @param id Proposal ID
     * @param templateType Template type to use
     * @return HTML string
     */
    @Transactional(readOnly = true)
    public String generateInvoiceHtml(String id, com.ultron.backend.domain.enums.InvoiceTemplateType templateType) {
        String tenantId = getCurrentTenantId();
        Proposal proposal = findProposalById(id, tenantId);
        com.ultron.backend.domain.entity.Organization organization =
            organizationRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        return invoiceTemplateService.generateInvoiceHtml(proposal, organization, templateType);
    }

    /**
     * Generate invoice PDF using template
     * @param id Proposal ID
     * @param templateType Template type to use
     * @return PDF as byte array
     */
    @Transactional(readOnly = true)
    public byte[] generateInvoicePdf(String id, com.ultron.backend.domain.enums.InvoiceTemplateType templateType) {
        String tenantId = getCurrentTenantId();
        Proposal proposal = findProposalById(id, tenantId);
        com.ultron.backend.domain.entity.Organization organization =
            organizationRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        try {
            return invoiceTemplateService.generateInvoicePdf(proposal, organization, templateType);
        } catch (Exception e) {
            log.error("Failed to generate invoice PDF for proposal {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to generate invoice PDF: " + e.getMessage(), e);
        }
    }

    @Transactional
    public ProposalResponse updateProposal(String id, UpdateProposalRequest request, String userId) {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Updating proposal {} by user {}", tenantId, id, userId);

        Proposal proposal = findProposalById(id, tenantId);

        // Validate tenant ownership
        validateResourceTenantOwnership(proposal.getTenantId());

        // Block updates if proposal is already accepted or rejected
        if (proposal.getStatus() == ProposalStatus.ACCEPTED || proposal.getStatus() == ProposalStatus.REJECTED) {
            throw new IllegalStateException("Cannot update proposal in " + proposal.getStatus() + " status");
        }

        // Update fields only if provided (null-safe)
        boolean needsRecalculation = false;

        if (request.getTitle() != null) {
            proposal.setTitle(request.getTitle());
        }

        if (request.getDescription() != null) {
            proposal.setDescription(request.getDescription());
        }

        if (request.getValidUntil() != null) {
            proposal.setValidUntil(request.getValidUntil());
        }

        if (request.getCompanyName() != null) {
            proposal.setCompanyName(request.getCompanyName());
        }

        if (request.getCustomerName() != null) {
            proposal.setCustomerName(request.getCustomerName());
        }

        if (request.getCustomerEmail() != null) {
            proposal.setCustomerEmail(request.getCustomerEmail());
        }

        if (request.getCustomerPhone() != null) {
            proposal.setCustomerPhone(request.getCustomerPhone());
        }

        if (request.getBillingAddress() != null) {
            proposal.setBillingAddress(mapToAddress(request.getBillingAddress()));
        }

        if (request.getShippingAddress() != null) {
            proposal.setShippingAddress(mapToAddress(request.getShippingAddress()));
        }

        if (request.getLineItems() != null) {
            List<Proposal.ProposalLineItem> lineItems = buildUpdateLineItems(request.getLineItems(), tenantId);
            proposal.setLineItems(lineItems);
            needsRecalculation = true;
        }

        if (request.getDiscount() != null) {
            Proposal.DiscountConfig discount = null;
            if (request.getDiscount().getOverallDiscountType() != null) {
                discount = Proposal.DiscountConfig.builder()
                        .overallDiscountType(request.getDiscount().getOverallDiscountType())
                        .overallDiscountValue(request.getDiscount().getOverallDiscountValue())
                        .discountReason(request.getDiscount().getDiscountReason())
                        .build();
            }
            proposal.setDiscount(discount);
            needsRecalculation = true;
        }

        if (request.getGstType() != null) {
            proposal.setGstType(request.getGstType());
            needsRecalculation = true; // Tax type changed, need to recalculate tax
        }
        if (request.getGstNumber() != null) {
            proposal.setGstNumber(request.getGstNumber());
        }

        if (request.getPaymentTerms() != null) {
            proposal.setPaymentTerms(request.getPaymentTerms());
        }

        if (request.getDeliveryTerms() != null) {
            proposal.setDeliveryTerms(request.getDeliveryTerms());
        }

        if (request.getNotes() != null) {
            proposal.setNotes(request.getNotes());
        }

        if (request.getPaymentMilestones() != null) {
            proposal.setPaymentMilestones(mapMilestones(request.getPaymentMilestones()));
        }

        if (request.getApproverIds() != null) {
            proposal.setApproverIds(request.getApproverIds());
        }

        if (request.getIsTechnicalQuotation() != null) {
            proposal.setIsTechnicalQuotation(request.getIsTechnicalQuotation());
        }

        if (request.getShowDiscount() != null) {
            proposal.setShowDiscount(request.getShowDiscount());
        }

        // Update audit fields
        proposal.setLastModifiedAt(LocalDateTime.now());
        proposal.setLastModifiedBy(userId);
        proposal.setLastModifiedByName(getUserName(userId));

        if (request.getStatus() != null && request.getStatus() != proposal.getStatus()) {
            ProposalStatus oldStatus = proposal.getStatus();
            ProposalStatus newStatus = request.getStatus();
            
            // Apply status specific logic
            switch (newStatus) {
                case SENT:
                    proposal.setSentAt(LocalDateTime.now());
                    break;
                case ACCEPTED:
                    proposal.setAcceptedAt(LocalDateTime.now());
                    break;
                case REJECTED:
                    proposal.setRejectedAt(LocalDateTime.now());
                    break;
                default:
                    // DRAFT or EXPIRED - no specific timestamp to set
                    break;
            }
            
            proposal.setStatus(newStatus);
            
            // Log status change audit
            auditLogService.logAsync("PROPOSAL", proposal.getId(), proposal.getTitle(),
                    "STATUS_CHANGE", "Proposal status updated to " + newStatus,
                    oldStatus.toString(), newStatus.toString(),
                    userId, null);
        }

        // Recalculate totals if line items or discount changed
        if (needsRecalculation) {
            proposal = calculationService.calculateTotals(proposal);
        }

        Proposal saved = proposalRepository.save(proposal);

        log.info("Proposal updated: proposalId={}, updatedBy={}", saved.getProposalId(), userId);

        // Log update audit
        auditLogService.logAsync("PROPOSAL", saved.getId(), saved.getTitle(),
                "UPDATE", "Proposal details updated",
                null, null,
                userId, null);

        // Create version snapshot
        proposalVersioningService.createSnapshot(saved, "UPDATED", "Proposal details updated", userId);

        // Sync opportunity amount if applicable
        if (saved.getOpportunityId() != null) {
            syncOpportunityAmount(saved.getOpportunityId());
        }

        // Handle auto-generation if status changed to ACCEPTED in this update
        if (request.getStatus() != null && request.getStatus() == ProposalStatus.ACCEPTED && proposal.getStatus() == ProposalStatus.ACCEPTED) {
            if (saved.getPaymentMilestones() != null && !saved.getPaymentMilestones().isEmpty()) {
                int nextIndex = saved.getCurrentMilestoneIndex() + 1;
                if (nextIndex < saved.getPaymentMilestones().size()) {
                    generateNextMilestoneProposal(saved, nextIndex, userId);
                }
            }
        }

        return mapToResponse(saved);
    }

    @Transactional
    public ProposalResponse sendProposal(String id, String userId) {
        String tenantId = getCurrentTenantId();
        Proposal proposal = findProposalById(id, tenantId);

        // Validate tenant ownership
        validateResourceTenantOwnership(proposal.getTenantId());

        if (proposal.getStatus() != ProposalStatus.DRAFT) {
            throw new IllegalStateException("Only draft proposals can be sent");
        }

        ProposalStatus oldStatus = proposal.getStatus();
        proposal.setStatus(ProposalStatus.SENT);
        proposal.setSentAt(LocalDateTime.now());
        proposal.setLastModifiedAt(LocalDateTime.now());
        proposal.setLastModifiedBy(userId);
        proposal.setLastModifiedByName(getUserName(userId));

        Proposal saved = proposalRepository.save(proposal);

        log.info("Proposal sent: proposalId={}, sentBy={}", saved.getProposalId(), userId);

        // Log status change audit
        auditLogService.logAsync("PROPOSAL", saved.getId(), saved.getTitle(),
                "STATUS_CHANGE", "Proposal sent to customer",
                oldStatus.toString(), saved.getStatus().toString(),
                userId, null);

        // Create version snapshot
        proposalVersioningService.createSnapshot(saved, "SENT", "Proposal sent to customer", userId);

        // P0 #10: Notify proposal owner that proposal was sent
        if (saved.getOwnerId() != null) {
            try {
                String customerInfo = saved.getSourceName() != null ? " to " + saved.getSourceName() : "";
                notificationService.createAndSendNotification(
                    saved.getOwnerId(),
                    "✉️ Proposal Sent: " + saved.getProposalId(),
                    "Your proposal '" + saved.getTitle() + "' has been sent" + customerInfo,
                    "PROPOSAL_SENT",
                    "/proposals/" + saved.getId()
                );
                log.info("Notification sent for proposal send: {}", saved.getProposalId());
            } catch (Exception e) {
                log.error("Failed to send notification for proposal send: {}", saved.getProposalId(), e);
            }
        }

        // TODO: Send email notification to customer

        // Sync opportunity amount if applicable
        if (saved.getOpportunityId() != null) {
            syncOpportunityAmount(saved.getOpportunityId());
        }

        return mapToResponse(saved);
    }

    @Transactional
    public ProposalResponse acceptProposal(String id, String userId) {
        String tenantId = getCurrentTenantId();
        Proposal proposal = findProposalById(id, tenantId);

        // Validate tenant ownership
        validateResourceTenantOwnership(proposal.getTenantId());

        System.out.println("DEBUG: acceptProposal called for status: " + proposal.getStatus());
        if (proposal.getStatus() != ProposalStatus.SENT && 
            proposal.getStatus() != ProposalStatus.PENDING_APPROVAL && 
            proposal.getStatus() != ProposalStatus.PENDING_ON_CUSTOMER) {
            throw new IllegalStateException("Proposal cannot be accepted in current status: " + proposal.getStatus());
        }

        ProposalStatus oldStatus = proposal.getStatus();
        proposal.setStatus(ProposalStatus.ACCEPTED);
        proposal.setAcceptedAt(LocalDateTime.now());
        proposal.setLastModifiedAt(LocalDateTime.now());
        proposal.setLastModifiedBy(userId);
        proposal.setLastModifiedByName(getUserName(userId));

        Proposal saved = proposalRepository.save(proposal);

        log.info("Proposal accepted: proposalId={}, acceptedBy={}", saved.getProposalId(), userId);

        // Log status change audit
        auditLogService.logAsync("PROPOSAL", saved.getId(), saved.getTitle(),
                "STATUS_CHANGE", "Proposal accepted by customer",
                oldStatus.toString(), saved.getStatus().toString(),
                userId, null);

        // Create version snapshot
        proposalVersioningService.createSnapshot(saved, "ACCEPTED", "Proposal accepted by customer", userId);

        // P0 #11: Notify proposal owner about acceptance (MAJOR MILESTONE!)
        if (saved.getOwnerId() != null) {
            try {
                String amountInfo = saved.getTotalAmount() != null ? " (Amount: ₹" + saved.getTotalAmount() + ")" : "";
                String customerInfo = saved.getSourceName() != null ? " by " + saved.getSourceName() : "";
                notificationService.createAndSendNotification(
                    saved.getOwnerId(),
                    "🎉 Proposal Accepted: " + saved.getProposalId(),
                    "Congratulations! Proposal '" + saved.getTitle() + "' has been accepted" + customerInfo + amountInfo,
                    "PROPOSAL_ACCEPTED",
                    "/proposals/" + saved.getId()
                );
                log.info("Notification sent for proposal acceptance: {}", saved.getProposalId());
            } catch (Exception e) {
                log.error("Failed to send notification for proposal acceptance: {}", saved.getProposalId(), e);
            }
        }

        // Sync opportunity amount if applicable
        if (saved.getOpportunityId() != null) {
            syncOpportunityAmount(saved.getOpportunityId());
        }

        // Auto-generate next milestone proposal if applicable
        if (saved.getPaymentMilestones() != null && !saved.getPaymentMilestones().isEmpty()) {
            int nextIndex = saved.getCurrentMilestoneIndex() + 1;
            if (nextIndex < saved.getPaymentMilestones().size()) {
                generateNextMilestoneProposal(saved, nextIndex, userId);
            }
        }

        // TODO: Auto-create Opportunity if source is LEAD
        // TODO: Update Opportunity stage if source is OPPORTUNITY

        return mapToResponse(saved);
    }

    @Transactional
    public ProposalResponse requestApproval(String id, String userId) {
        String tenantId = getCurrentTenantId();
        Proposal proposal = findProposalById(id, tenantId);

        // Validate tenant ownership
        validateResourceTenantOwnership(proposal.getTenantId());

        if (proposal.getStatus() != ProposalStatus.DRAFT && 
            proposal.getStatus() != ProposalStatus.PENDING_APPROVAL && 
            proposal.getStatus() != ProposalStatus.PENDING_ON_CUSTOMER) {
            throw new IllegalStateException("Only draft, pending approval or pending on customer quotations can be sent for approval");
        }
        
        if (proposal.getApproverIds() == null || proposal.getApproverIds().isEmpty()) {
            throw new IllegalStateException("No approvers assigned to this quotation");
        }

        ProposalStatus oldStatus = proposal.getStatus();
        proposal.setStatus(ProposalStatus.PENDING_APPROVAL);
        proposal.setApprovedByIds(List.of()); // reset approvals just in case
        proposal.setApprovedByNames(List.of());
        proposal.setLastModifiedAt(LocalDateTime.now());
        proposal.setLastModifiedBy(userId);
        proposal.setLastModifiedByName(getUserName(userId));

        Proposal saved = proposalRepository.save(proposal);

        log.info("Quotation approval requested: proposalId={}, requestedBy={}", saved.getProposalId(), userId);

        auditLogService.logAsync("PROPOSAL", saved.getId(), saved.getTitle(),
                "STATUS_CHANGE", "Quotation sent for approval",
                oldStatus.toString(), saved.getStatus().toString(),
                userId, null);

        proposalVersioningService.createSnapshot(saved, "PENDING_APPROVAL", "Quotation sent for approval", userId);

        // Notify approvers
        for (String approverId : saved.getApproverIds()) {
            try {
                notificationService.createAndSendNotification(
                    approverId,
                    "Quotation Approval Required: " + saved.getProposalId(),
                    "Quotation '" + saved.getTitle() + "' requires your approval before sending to customer.",
                    "PROPOSAL_APPROVAL_REQUESTED",
                    "/proposals/" + saved.getId()
                );
            } catch (Exception e) {
                log.error("Failed to notify approver {}: {}", approverId, e.getMessage());
            }
        }

        return mapToResponse(saved);
    }

    @Transactional
    public ProposalResponse approve(String id, String userId) {
        String tenantId = getCurrentTenantId();
        Proposal proposal = findProposalById(id, tenantId);

        validateResourceTenantOwnership(proposal.getTenantId());

        if (proposal.getStatus() != ProposalStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Proposal is not pending approval");
        }

        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User context not found"));

        boolean isAssigned = false;
        if (proposal.getApproverIds() != null) {
            isAssigned = proposal.getApproverIds().contains(currentUser.getId()) || 
                         (currentUser.getUserId() != null && proposal.getApproverIds().contains(currentUser.getUserId()));
        }

        // Admin/Manager bypass or assigned check
        if (!isAssigned && currentUser.getRole() != UserRole.ADMIN && currentUser.getRole() != UserRole.MANAGER) {
            throw new IllegalStateException("You are not an assigned approver for this quotation");
        }

        List<String> approvedBy = proposal.getApprovedByIds() != null ? new java.util.ArrayList<>(proposal.getApprovedByIds()) : new java.util.ArrayList<>();
        if (approvedBy.contains(userId)) {
            throw new IllegalStateException("You already approved this quotation");
        }
        
        approvedBy.add(userId);
        proposal.setApprovedByIds(approvedBy);
        
        List<String> approvedByNames = proposal.getApprovedByNames() != null ? new java.util.ArrayList<>(proposal.getApprovedByNames()) : new java.util.ArrayList<>();
        String userName = currentUser.getProfile() != null ? currentUser.getProfile().getFullName() : currentUser.getFullName();
        if (userName != null && !approvedByNames.contains(userName)) {
            approvedByNames.add(userName);
        }
        proposal.setApprovedByNames(approvedByNames);

        proposal.setLastModifiedAt(LocalDateTime.now());
        proposal.setLastModifiedBy(userId);
        proposal.setLastModifiedByName(userName);

        ProposalStatus oldStatus = proposal.getStatus();
        // Any single approval moves it to PENDING_ON_CUSTOMER (as per user requirement)
        proposal.setStatus(ProposalStatus.PENDING_ON_CUSTOMER);

        Proposal saved = proposalRepository.save(proposal);

        log.info("Quotation approved: proposalId={}, approvedBy={}", saved.getProposalId(), userId);

        auditLogService.logAsync("PROPOSAL", saved.getId(), saved.getTitle(),
                "STATUS_CHANGE", "Quotation approved by " + getUserName(userId),
                oldStatus.toString(), saved.getStatus().toString(),
                userId, null);

        proposalVersioningService.createSnapshot(saved, "PENDING_ON_CUSTOMER", 
                "Quotation approved by " + getUserName(userId), userId);

        // Notify owner about approval
        if (saved.getOwnerId() != null) {
            try {
                notificationService.createAndSendNotification(
                    saved.getOwnerId(),
                    "Quotation Approved \u2705: " + saved.getProposalId(),
                    "Quotation '" + saved.getTitle() + "' was approved by " + getUserName(userId) + " and is ready for the customer.",
                    "PROPOSAL_APPROVED",
                    "/proposals/" + saved.getId()
                );
            } catch (Exception e) {
                log.error("Failed to notify owner {}: {}", saved.getOwnerId(), e.getMessage());
            }
        }

        return mapToResponse(saved);
    }

    @Transactional
    public ProposalResponse rejectByApprover(String id, String reason, String userId) {
        String tenantId = getCurrentTenantId();
        Proposal proposal = findProposalById(id, tenantId);

        validateResourceTenantOwnership(proposal.getTenantId());

        if (proposal.getStatus() != ProposalStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Proposal is not pending approval");
        }

        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User context not found"));

        boolean isAssigned = false;
        if (proposal.getApproverIds() != null) {
            isAssigned = proposal.getApproverIds().contains(currentUser.getId()) || 
                         (currentUser.getUserId() != null && proposal.getApproverIds().contains(currentUser.getUserId()));
        }

        // Admin/Manager bypass or assigned check
        if (!isAssigned && currentUser.getRole() != UserRole.ADMIN && currentUser.getRole() != UserRole.MANAGER) {
            throw new IllegalStateException("You are not an assigned approver for this quotation");
        }

        ProposalStatus oldStatus = proposal.getStatus();
        proposal.setStatus(ProposalStatus.DRAFT); // Move back to draft for fixing
        proposal.setLastModifiedAt(LocalDateTime.now());
        proposal.setLastModifiedBy(userId);
        proposal.setLastModifiedByName(getUserName(userId));
        
        // Clear previous approvals on internal rejection
        proposal.setApprovedByIds(List.of());
        proposal.setApprovedByNames(List.of());

        Proposal saved = proposalRepository.save(proposal);

        log.info("Quotation rejected by approver: proposalId={}, rejectedBy={}, reason={}", 
                 saved.getProposalId(), userId, reason);

        auditLogService.logAsync("PROPOSAL", saved.getId(), saved.getTitle(),
                "STATUS_CHANGE", "Quotation rejected by approver: " + getUserName(userId) + ". Reason: " + reason,
                oldStatus.toString(), saved.getStatus().toString(),
                userId, Map.of("reason", reason != null ? reason : ""));

        proposalVersioningService.createSnapshot(saved, "DRAFT", 
                "Quotation rejected by approver: " + getUserName(userId) + ". Reason: " + reason, userId);

        // Notify owner about rejection
        if (saved.getOwnerId() != null) {
            try {
                notificationService.createAndSendNotification(
                    saved.getOwnerId(),
                    "Quotation Rejected by Approver \u274C: " + saved.getProposalId(),
                    "Quotation '" + saved.getTitle() + "' was rejected by " + getUserName(userId) + ". Reason: " + reason,
                    "PROPOSAL_REJECTED_INTERNAL",
                    "/proposals/" + saved.getId()
                );
            } catch (Exception e) {
                log.error("Failed to notify owner {}: {}", saved.getOwnerId(), e.getMessage());
            }
        }

        return mapToResponse(saved);
    }

    @Transactional
    public List<ProposalResponse> convertToProformaWithMilestones(String id, List<CreateProposalRequest.PaymentMilestoneDTO> milestones, String userId) {
        String tenantId = getCurrentTenantId();
        Proposal proposal = findProposalById(id, tenantId);

        // Validate tenant ownership
        validateResourceTenantOwnership(proposal.getTenantId());

        if (proposal.getStatus() != ProposalStatus.ACCEPTED) {
            throw new IllegalStateException("Only accepted quotations can be converted to Proforma Invoice");
        }

        if (Boolean.TRUE.equals(proposal.getIsProforma())) {
            throw new IllegalStateException("This is already a Proforma Invoice");
        }

        if (milestones == null || milestones.isEmpty()) {
            throw new IllegalArgumentException("Milestones are required to convert to multiple Proforma Invoices");
        }

        // Validate milestones total 100%
        BigDecimal totalPercentage = milestones.stream()
                .map(CreateProposalRequest.PaymentMilestoneDTO::getPercentage)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (totalPercentage.compareTo(new BigDecimal("100")) != 0) {
            throw new IllegalArgumentException("Milestone percentages must total 100%");
        }

        List<Proposal> generatedProformas = new java.util.ArrayList<>();
        
        // Original proposal total amounts
        BigDecimal originalSubtotal = proposal.getSubtotal();
        BigDecimal originalTax = proposal.getTaxAmount();
        BigDecimal originalDiscount = proposal.getDiscountAmount();
        BigDecimal originalTotal = proposal.getTotalAmount();

        for (int i = 0; i < milestones.size(); i++) {
            CreateProposalRequest.PaymentMilestoneDTO milestone = milestones.get(i);
            BigDecimal percentage = milestone.getPercentage().divide(new BigDecimal("100"), 4, java.math.RoundingMode.HALF_UP);

            boolean isLast = (i == milestones.size() - 1);

            // Generate new proposal ID for proforma
            String proformaId = proposalIdGeneratorService.generateProposalId(); 

            BigDecimal milestoneSubtotalPart = originalSubtotal.multiply(percentage).setScale(2, java.math.RoundingMode.HALF_UP);
            BigDecimal milestoneTax = isLast ? originalTax : BigDecimal.ZERO;
            BigDecimal milestonePayable = milestoneSubtotalPart.add(milestoneTax);

            // Deep copy proposal properties
            Proposal proforma = Proposal.builder()
                    .proposalId(proformaId)
                    .tenantId(tenantId)
                    .source(proposal.getSource())
                    .sourceId(proposal.getSourceId())
                    .sourceName(proposal.getSourceName())
                    .proposalNumber(proformaId)
                    .title(proposal.getTitle() + " - " + milestone.getName())
                    .description(proposal.getDescription())
                    .validUntil(proposal.getValidUntil())
                    .companyName(proposal.getCompanyName())
                    .customerName(proposal.getCustomerName())
                    .customerEmail(proposal.getCustomerEmail())
                    .customerPhone(proposal.getCustomerPhone())
                    .billingAddress(proposal.getBillingAddress())
                    .shippingAddress(proposal.getShippingAddress())
                    .gstType(isLast ? proposal.getGstType() : com.ultron.backend.domain.enums.GstType.NONE)
                    .gstNumber(proposal.getGstNumber())
                    .status(ProposalStatus.DRAFT)
                    .ownerId(userId)
                    .ownerName(getUserName(userId))
                    .paymentTerms(proposal.getPaymentTerms())
                    .deliveryTerms(proposal.getDeliveryTerms())
                    .notes(proposal.getNotes())
                    .isDeleted(false)
                    .createdAt(LocalDateTime.now())
                    .createdBy(userId)
                    .createdByName(getUserName(userId))
                    .isProforma(true)
                    .parentProposalId(proposal.getId())
                    .leadId(proposal.getLeadId())
                    .leadName(proposal.getLeadName())
                    .opportunityId(proposal.getOpportunityId())
                    .opportunityName(proposal.getOpportunityName())
                    .accountId(proposal.getAccountId())
                    .accountName(proposal.getAccountName())
                    .contactId(proposal.getContactId())
                    .contactName(proposal.getContactName())
                    .subtotal(originalSubtotal)
                    .taxAmount(milestoneTax)
                    .discountAmount(originalDiscount)
                    .totalAmount(originalSubtotal.add(milestoneTax))
                    .milestonePayableAmount(milestonePayable)
                    .parentTaxAmount(originalTax)
                    .milestoneIncludesGst(isLast && originalTax != null && originalTax.compareTo(BigDecimal.ZERO) > 0)
                    .build();

            // Set a single milestone reflecting the percentage of this proforma from parent
            Proposal.PaymentMilestone singleMilestone = Proposal.PaymentMilestone.builder()
                    .name(milestone.getName())
                    .percentage(milestone.getPercentage())
                    .build();
            proforma.setPaymentMilestones(List.of(singleMilestone));
            proforma.setCurrentMilestoneIndex(0);

            // Scale line items (quantity stays same, unit price stays same, tax changes)
            if (proposal.getLineItems() != null) {
                List<Proposal.ProposalLineItem> newItems = new java.util.ArrayList<>();
                for (Proposal.ProposalLineItem item : proposal.getLineItems()) {
                    Proposal.ProposalLineItem newItem = Proposal.ProposalLineItem.builder()
                            .lineItemId(UUID.randomUUID().toString())
                            .productId(item.getProductId())
                            .productName(item.getProductName())
                            .sku(item.getSku())
                            .description(item.getDescription())
                            .quantity(item.getQuantity())
                            .unit(item.getUnit())
                            .hsnCode(item.getHsnCode())
                            .unitPrice(item.getUnitPrice())
                            .taxRate(isLast ? item.getTaxRate() : BigDecimal.ZERO)
                            .discountType(item.getDiscountType())
                            .discountValue(item.getDiscountValue())
                            .build();

                    // Recalculate line totals
                    BigDecimal lineSubtotal = newItem.getUnitPrice().multiply(newItem.getQuantity());
                    newItem.setLineSubtotal(lineSubtotal);
                    
                    BigDecimal lineDiscountAmount = BigDecimal.ZERO;
                    if (newItem.getDiscountValue() != null && newItem.getDiscountValue().compareTo(BigDecimal.ZERO) > 0) {
                        if (newItem.getDiscountType() == com.ultron.backend.domain.enums.DiscountType.PERCENTAGE) {
                            lineDiscountAmount = lineSubtotal.multiply(newItem.getDiscountValue()).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
                        } else {
                            lineDiscountAmount = newItem.getDiscountValue();
                        }
                    }
                    newItem.setLineDiscountAmount(lineDiscountAmount);

                    BigDecimal taxableAmount = lineSubtotal.subtract(lineDiscountAmount);
                    BigDecimal lineTaxAmount = BigDecimal.ZERO;
                    if (newItem.getTaxRate() != null && newItem.getTaxRate().compareTo(BigDecimal.ZERO) > 0) {
                        lineTaxAmount = taxableAmount.multiply(newItem.getTaxRate()).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
                    }
                    newItem.setLineTaxAmount(lineTaxAmount);

                    newItem.setLineTotal(taxableAmount.add(lineTaxAmount));
                    newItems.add(newItem);
                }
                proforma.setLineItems(newItems);
            }

            // Copy overall discount (if any), scaling fixed amounts
            if (proposal.getDiscount() != null) {
                Proposal.DiscountConfig newDiscount = Proposal.DiscountConfig.builder()
                        .overallDiscountType(proposal.getDiscount().getOverallDiscountType())
                        .discountReason(proposal.getDiscount().getDiscountReason())
                        .build();
                
                if (proposal.getDiscount().getOverallDiscountType() == com.ultron.backend.domain.enums.DiscountType.FIXED_AMOUNT) {
                    newDiscount.setOverallDiscountValue(proposal.getDiscount().getOverallDiscountValue().multiply(percentage).setScale(2, java.math.RoundingMode.HALF_UP));
                } else {
                    newDiscount.setOverallDiscountValue(proposal.getDiscount().getOverallDiscountValue());
                }
                proforma.setDiscount(newDiscount);
            }

            Proposal savedProforma = proposalRepository.save(proforma);
            generatedProformas.add(savedProforma);

            // Create version snapshot for new proforma
            proposalVersioningService.createSnapshot(savedProforma, "CREATED_FROM_QUOTATION", "Converted from Quotation " + proposal.getProposalId(), userId);
        }

        // Technically we leave the Quotation as ACCEPTED, or we could change it to indicate it's been converted.
        // We'll leave it as ACCEPTED, but knowing the proformas generated from it.

        proposal.setHasBeenConverted(true);
        proposalRepository.save(proposal);

        log.info("Quotation {} converted to {} Proforma Invoices", proposal.getProposalId(), generatedProformas.size());

        auditLogService.logAsync("PROPOSAL", proposal.getId(), proposal.getTitle(),
                "CONVERT_TO_PROFORMA", "Quotation converted to " + generatedProformas.size() + " Proforma Invoices",
                null, null,
                userId, null);

        proposalVersioningService.createSnapshot(proposal, "CONVERT_TO_PROFORMA", "Converted to " + generatedProformas.size() + " Proforma Invoices", userId);

        if (proposal.getOwnerId() != null) {
            try {
                notificationService.createAndSendNotification(
                    proposal.getOwnerId(),
                    "Quotation Converted: " + proposal.getProposalId(),
                    "Quotation '" + proposal.getTitle() + "' has been converted into " + generatedProformas.size() + " Proforma Invoice(s)",
                    "PROPOSAL_PROFORMA_CONVERTED",
                    "/proposals/" + proposal.getId() // Or maybe a different route for seeing related
                );
            } catch (Exception e) {
                log.error("Failed to set notification: {}", e.getMessage());
            }
        }

        return generatedProformas.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public ProposalResponse convertToProforma(String id, String userId) {
        String tenantId = getCurrentTenantId();
        Proposal proposal = findProposalById(id, tenantId);

        // Validate tenant ownership
        validateResourceTenantOwnership(proposal.getTenantId());

        if (proposal.getStatus() != ProposalStatus.ACCEPTED) {
            throw new IllegalStateException("Only accepted quotations can be converted to Proforma Invoice");
        }

        if (Boolean.TRUE.equals(proposal.getIsProforma())) {
            throw new IllegalStateException("This proposal is already a Proforma Invoice");
        }

        proposal.setIsProforma(true);
        proposal.setHasBeenConverted(true);
        proposal.setMilestonePayableAmount(proposal.getTotalAmount());
        proposal.setLastModifiedAt(LocalDateTime.now());
        proposal.setLastModifiedBy(userId);
        proposal.setLastModifiedByName(getUserName(userId));

        Proposal saved = proposalRepository.save(proposal);

        log.info("Proposal converted to Proforma: proposalId={}, convertedBy={}", saved.getProposalId(), userId);

        // Log audit
        auditLogService.logAsync("PROPOSAL", saved.getId(), saved.getTitle(),
                "CONVERT_TO_PROFORMA", "Proposal converted to Proforma Invoice",
                null, null,
                userId, null);

        // Create version snapshot
        proposalVersioningService.createSnapshot(saved, "CONVERT_TO_PROFORMA", "Converted to Proforma Invoice", userId);

        // P1 #15: Notify proposal owner about conversion to Proforma
        if (saved.getOwnerId() != null) {
            try {
                notificationService.createAndSendNotification(
                    saved.getOwnerId(),
                    "Converted to Proforma: " + saved.getProposalId(),
                    "Proposal '" + saved.getTitle() + "' has been converted to Proforma Invoice",
                    "PROPOSAL_PROFORMA_CONVERTED",
                    "/proposals/" + saved.getId()
                );
                log.info("Notification sent for proforma conversion: {}", saved.getProposalId());
            } catch (Exception e) {
                log.error("Failed to send notification for proforma conversion: {}", saved.getProposalId(), e);
            }
        }

        return mapToResponse(saved);
    }

    @Transactional
    public ProposalResponse rejectProposal(String id, String reason, String userId) {
        String tenantId = getCurrentTenantId();
        Proposal proposal = findProposalById(id, tenantId);

        // Validate tenant ownership
        validateResourceTenantOwnership(proposal.getTenantId());

        if (proposal.getStatus() != ProposalStatus.SENT && 
            proposal.getStatus() != ProposalStatus.PENDING_APPROVAL && 
            proposal.getStatus() != ProposalStatus.PENDING_ON_CUSTOMER) {
            throw new IllegalStateException("Proposal cannot be rejected in current status: " + proposal.getStatus());
        }

        ProposalStatus oldStatus = proposal.getStatus();
        proposal.setStatus(ProposalStatus.REJECTED);
        proposal.setRejectedAt(LocalDateTime.now());
        proposal.setRejectionReason(reason);
        proposal.setLastModifiedAt(LocalDateTime.now());
        proposal.setLastModifiedBy(userId);
        proposal.setLastModifiedByName(getUserName(userId));

        Proposal saved = proposalRepository.save(proposal);

        log.info("Proposal rejected: proposalId={}, rejectedBy={}, reason={}",
                 saved.getProposalId(), userId, reason);

        // Log status change audit
        auditLogService.logAsync("PROPOSAL", saved.getId(), saved.getTitle(),
                "STATUS_CHANGE", "Proposal rejected by customer. Reason: " + reason,
                oldStatus.toString(), saved.getStatus().toString(),
                userId, Map.of("reason", reason));

        // Create version snapshot
        proposalVersioningService.createSnapshot(saved, "REJECTED", "Proposal rejected by customer. Reason: " + reason, userId);

        // P0 #12: Notify proposal owner about rejection
        if (saved.getOwnerId() != null) {
            try {
                String reasonInfo = reason != null && !reason.isEmpty() ? " Reason: " + reason : "";
                notificationService.createAndSendNotification(
                    saved.getOwnerId(),
                    "Proposal Rejected: " + saved.getProposalId(),
                    "Proposal '" + saved.getTitle() + "' has been rejected by customer" + reasonInfo,
                    "PROPOSAL_REJECTED",
                    "/proposals/" + saved.getId()
                );
                log.info("Notification sent for proposal rejection: {}", saved.getProposalId());
            } catch (Exception e) {
                log.error("Failed to send notification for proposal rejection: {}", saved.getProposalId(), e);
            }
        }

        // Sync opportunity amount if applicable
        if (saved.getOpportunityId() != null) {
            syncOpportunityAmount(saved.getOpportunityId());
        }

        return mapToResponse(saved);
    }

    public List<ProposalResponse> getAllProposals() {
        return getAllProposalsList(null);
    }

    public List<ProposalResponse> getAllProposalsList(Boolean isProforma) {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching all proposals, isProforma={}", tenantId, isProforma);
        
        List<Proposal> proposals;
        if (isProforma != null) {
            proposals = proposalRepository.findByIsProformaAndTenantIdAndIsDeletedFalse(isProforma, tenantId);
        } else {
            proposals = proposalRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        }
        
        return proposals.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<ProposalResponse> getAllProposals(Pageable pageable) {
        return getAllProposalsPage(null, pageable);
    }

    public Page<ProposalResponse> getAllProposalsPage(Boolean isProforma, Pageable pageable) {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching all proposals (paginated), isProforma={}", tenantId, isProforma);
        
        if (isProforma != null) {
            return proposalRepository.findByIsProformaAndTenantIdAndIsDeletedFalse(isProforma, tenantId, pageable)
                    .map(this::mapToResponse);
        } else {
            return proposalRepository.findByTenantIdAndIsDeletedFalse(tenantId, pageable)
                    .map(this::mapToResponse);
        }
    }

    public ProposalResponse getProposalById(String id) {
        String tenantId = getCurrentTenantId();
        Proposal proposal = findProposalById(id, tenantId);
        return mapToResponse(proposal);
    }

    public List<ProposalResponse> getProposalsBySource(ProposalSource source, String sourceId) {
        String tenantId = getCurrentTenantId();
        List<Proposal> proposals;
        if (source == ProposalSource.LEAD) {
            proposals = proposalRepository.findByLeadIdAndTenantIdAndIsDeletedFalse(sourceId, tenantId);
        } else if (source == ProposalSource.OPPORTUNITY) {
            proposals = proposalRepository.findByOpportunityIdAndTenantIdAndIsDeletedFalse(sourceId, tenantId);
        } else {
            // Fallback for any other sources
            proposals = proposalRepository.findBySourceAndSourceIdAndTenantIdAndIsDeletedFalse(source, sourceId, tenantId);
        }
        
        return proposals.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<ProposalResponse> getProposalsBySource(ProposalSource source, String sourceId, Pageable pageable) {
        String tenantId = getCurrentTenantId();
        return proposalRepository.findBySourceAndSourceIdAndTenantIdAndIsDeletedFalse(source, sourceId, tenantId, pageable)
                .map(this::mapToResponse);
    }

    public List<ProposalResponse> getProposalsByStatus(ProposalStatus status) {
        String tenantId = getCurrentTenantId();
        return proposalRepository.findByStatusAndTenantIdAndIsDeletedFalse(status, tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<ProposalResponse> getProposalsByStatus(ProposalStatus status, Pageable pageable) {
        String tenantId = getCurrentTenantId();
        return proposalRepository.findByStatusAndTenantIdAndIsDeletedFalse(status, tenantId, pageable)
                .map(this::mapToResponse);
    }

    public List<ProposalResponse> getProposalsByOwner(String ownerId) {
        String tenantId = getCurrentTenantId();
        return proposalRepository.findByOwnerIdAndTenantIdAndIsDeletedFalse(ownerId, tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<ProposalResponse> getProposalsByOwner(String ownerId, Pageable pageable) {
        String tenantId = getCurrentTenantId();
        return proposalRepository.findByOwnerIdAndTenantIdAndIsDeletedFalse(ownerId, tenantId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional
    public void deleteProposal(String id, String deletedBy) {
        String tenantId = getCurrentTenantId();
        Proposal proposal = findProposalById(id, tenantId);

        // Validate tenant ownership
        validateResourceTenantOwnership(proposal.getTenantId());

        // Soft delete
        proposal.setIsDeleted(true);
        proposal.setLastModifiedAt(LocalDateTime.now());
        proposal.setLastModifiedBy(deletedBy);
        proposal.setLastModifiedByName(getUserName(deletedBy));

        Proposal saved = proposalRepository.save(proposal);

        log.info("Proposal deleted: proposalId={}, deletedBy={}", proposal.getProposalId(), deletedBy);

        // Log audit event
        auditLogService.logAsync("PROPOSAL", saved.getId(), saved.getTitle(),
                "DELETED", "Proposal soft-deleted",
                "false", "true",
                deletedBy, null);
    }

    // Helper methods

    private Proposal findProposalById(String id, String tenantId) {
        Proposal proposal = proposalRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found with id: " + id));

        if (proposal.getIsDeleted()) {
            throw new ResourceNotFoundException("Proposal not found with id: " + id);
        }

        return proposal;
    }

    private List<Proposal.ProposalLineItem> buildCreateLineItems(List<CreateProposalRequest.LineItemDTO> dtos, String tenantId) {
        return dtos.stream().map(dto -> {
            // Try standard product first
            return productRepository.findByIdAndTenantId(dto.getProductId(), tenantId)
                    .map(product -> Proposal.ProposalLineItem.builder()
                            .lineItemId(UUID.randomUUID().toString())
                            .productId(product.getId())
                            .productName(dto.getProductName() != null && !dto.getProductName().isEmpty() ? dto.getProductName() : product.getProductName())
                            .sku(product.getSku())
                            .description(dto.getDescription() != null ? dto.getDescription() : product.getDescription())
                            .quantity(dto.getQuantity())
                            .unit(dto.getUnit() != null && !dto.getUnit().isEmpty() ? dto.getUnit() : product.getUnit())
                            .hsnCode(dto.getHsnCode() != null && !dto.getHsnCode().isEmpty() ? dto.getHsnCode() : product.getHsnCode())
                            .listPrice(dto.getListPrice() != null ? dto.getListPrice() : (product.getListPrice() != null ? product.getListPrice() : product.getBasePrice()))
                            .unitPrice(dto.getUnitPrice() != null ? dto.getUnitPrice() : product.getBasePrice())
                            .taxRate(product.getTaxRate())
                            .discountType(dto.getDiscountType())
                            .discountValue(dto.getDiscountValue())
                            .build())
                    .orElseGet(() -> {
                        // Try dynamic product
                        DynamicProduct dynamicProduct = dynamicProductRepository.findByIdAndTenantId(dto.getProductId(), tenantId)
                                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + dto.getProductId()));

                        return mapDynamicProductToLineItem(dynamicProduct, dto);
                    });
        }).collect(Collectors.toList());
    }

    private Proposal.ProposalLineItem mapDynamicProductToLineItem(DynamicProduct product, CreateProposalRequest.LineItemDTO dto) {
        return Proposal.ProposalLineItem.builder()
                .lineItemId(UUID.randomUUID().toString())
                .productId(product.getId())
                .productName(dto.getProductName() != null && !dto.getProductName().isEmpty() ? dto.getProductName() : getProductNameFallback(product))
                .sku(product.getProductId()) // Use business ID as SKU
                .description(dto.getDescription() != null ? dto.getDescription() : findAttributeValue(product, "description", null))
                .quantity(dto.getQuantity())
                .unit(dto.getUnit() != null && !dto.getUnit().isEmpty() ? dto.getUnit() : findAttributeValue(product, "unit", "pcs"))
                .hsnCode(dto.getHsnCode() != null && !dto.getHsnCode().isEmpty() ? dto.getHsnCode() : findAttributeValue(product, "hsn", null))
                .unitPrice(dto.getUnitPrice() != null ? dto.getUnitPrice() : BigDecimal.valueOf(findAttributeNumericValue(product, "price", 0.0)))
                .taxRate(BigDecimal.valueOf(findAttributeNumericValue(product, "tax", 0.0)))
                .discountType(dto.getDiscountType())
                .discountValue(dto.getDiscountValue())
                .build();
    }

    private Proposal.ProposalLineItem mapDynamicProductToLineItem(DynamicProduct product, UpdateProposalRequest.LineItemDTO dto) {
        return Proposal.ProposalLineItem.builder()
                .lineItemId(UUID.randomUUID().toString())
                .productId(product.getId())
                .productName(dto.getProductName() != null && !dto.getProductName().isEmpty() ? dto.getProductName() : getProductNameFallback(product))
                .sku(product.getProductId()) // Use business ID as SKU
                .description(dto.getDescription() != null ? dto.getDescription() : findAttributeValue(product, "description", null))
                .quantity(dto.getQuantity())
                .unit(dto.getUnit() != null && !dto.getUnit().isEmpty() ? dto.getUnit() : findAttributeValue(product, "unit", "pcs"))
                .hsnCode(dto.getHsnCode() != null && !dto.getHsnCode().isEmpty() ? dto.getHsnCode() : findAttributeValue(product, "hsn", null))
                .unitPrice(dto.getUnitPrice() != null ? dto.getUnitPrice() : BigDecimal.valueOf(findAttributeNumericValue(product, "price", 0.0)))
                .taxRate(BigDecimal.valueOf(findAttributeNumericValue(product, "tax", 0.0)))
                .discountType(dto.getDiscountType())
                .discountValue(dto.getDiscountValue())
                .build();
    }

    private String getProductNameFallback(DynamicProduct product) {
        if (product.getAttributes() != null) {
            for (DynamicProduct.ProductAttribute attr : product.getAttributes()) {
                String k = attr.getKey().toLowerCase();
                if (k.equals("productname") || k.equals("product_name") || k.equals("name") || k.equals("itemname") || k.equals("item_name")) {
                    return attr.getValue();
                }
            }
        }
        return product.getDisplayName() != null ? product.getDisplayName() : "Unknown Product";
    }

    private String findAttributeValue(DynamicProduct product, String keyPartial, String defaultValue) {
        if (product.getAttributes() == null) return defaultValue;
        return product.getAttributes().stream()
                .filter(a -> a.getKey().contains(keyPartial))
                .findFirst()
                .map(ProductAttribute::getValue)
                .orElse(defaultValue);
    }

    private Double findAttributeNumericValue(DynamicProduct product, String keyPartial, Double defaultValue) {
        if (product.getAttributes() == null) return defaultValue;
        return product.getAttributes().stream()
                .filter(a -> a.getKey().contains(keyPartial))
                .findFirst()
                .map(ProductAttribute::getNumericValue)
                .orElse(defaultValue);
    }

    private List<Proposal.ProposalLineItem> buildUpdateLineItems(List<UpdateProposalRequest.LineItemDTO> dtos, String tenantId) {
        return dtos.stream().map(dto -> {
            // Try standard product first
            return productRepository.findByIdAndTenantId(dto.getProductId(), tenantId)
                    .map(product -> Proposal.ProposalLineItem.builder()
                            .lineItemId(UUID.randomUUID().toString())
                            .productId(product.getId())
                            .productName(dto.getProductName() != null && !dto.getProductName().isEmpty() ? dto.getProductName() : product.getProductName())
                            .sku(product.getSku())
                            .description(dto.getDescription() != null ? dto.getDescription() : product.getDescription())
                            .quantity(dto.getQuantity())
                            .unit(dto.getUnit() != null && !dto.getUnit().isEmpty() ? dto.getUnit() : product.getUnit())
                            .hsnCode(dto.getHsnCode() != null && !dto.getHsnCode().isEmpty() ? dto.getHsnCode() : product.getHsnCode())
                            .listPrice(dto.getListPrice() != null ? dto.getListPrice() : product.getListPrice())
                            .unitPrice(dto.getUnitPrice() != null ? dto.getUnitPrice() : product.getBasePrice())
                            .taxRate(product.getTaxRate())
                            .discountType(dto.getDiscountType())
                            .discountValue(dto.getDiscountValue())
                            .build())
                    .orElseGet(() -> {
                        // Try dynamic product
                        DynamicProduct dynamicProduct = dynamicProductRepository.findByIdAndTenantId(dto.getProductId(), tenantId)
                                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + dto.getProductId()));

                        return mapDynamicProductToLineItem(dynamicProduct, dto);
                    });
        }).collect(Collectors.toList());
    }

    private void validateSource(ProposalSource source, String sourceId, String tenantId) {
        if (source == ProposalSource.LEAD) {
            Lead lead = leadRepository.findById(sourceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Lead not found: " + sourceId));
            // Validate the source belongs to the same tenant
            validateResourceTenantOwnership(lead.getTenantId());
        } else {
            Opportunity opportunity = opportunityRepository.findById(sourceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found: " + sourceId));
            // Validate the source belongs to the same tenant
            validateResourceTenantOwnership(opportunity.getTenantId());
        }
    }

    private String getSourceName(ProposalSource source, String sourceId, String tenantId) {
        if (source == ProposalSource.LEAD) {
            Lead lead = leadRepository.findById(sourceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Lead not found: " + sourceId));
            // Validate the source belongs to the same tenant
            validateResourceTenantOwnership(lead.getTenantId());
            return lead.getFirstName() + " " + lead.getLastName();
        } else {
            Opportunity opportunity = opportunityRepository.findById(sourceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found: " + sourceId));
            // Validate the source belongs to the same tenant
            validateResourceTenantOwnership(opportunity.getTenantId());
            return opportunity.getOpportunityName();
        }
    }

    private String getUserName(String userId) {
        return userRepository.findById(userId)
                .map(user -> {
                    if (user.getProfile() != null && user.getProfile().getFullName() != null) {
                        return user.getProfile().getFullName();
                    }
                    return user.getUsername();
                })
                .orElse("Unknown");
    }

    private ProposalResponse mapToResponse(Proposal proposal) {
        return ProposalResponse.builder()
                .id(proposal.getId())
                .proposalId(proposal.getProposalId())
                .source(proposal.getSource())
                .sourceId(proposal.getSourceId())
                .sourceName(proposal.getSourceName())
                .customerId(proposal.getCustomerId())
                .companyName(proposal.getCompanyName())
                .customerName(proposal.getCustomerName())
                .customerEmail(proposal.getCustomerEmail())
                .customerPhone(proposal.getCustomerPhone())
                .billingAddress(proposal.getBillingAddress())
                .shippingAddress(proposal.getShippingAddress())
                .proposalNumber(proposal.getProposalNumber())
                .title(proposal.getTitle())
                .description(proposal.getDescription())
                .validUntil(proposal.getValidUntil())
                .lineItems(proposal.getLineItems())
                .discount(proposal.getDiscount())
                .gstType(proposal.getGstType() != null ? proposal.getGstType() : com.ultron.backend.domain.enums.GstType.NONE)
                .gstNumber(proposal.getGstNumber())
                .paymentMilestones(proposal.getPaymentMilestones())
                .currentMilestoneIndex(proposal.getCurrentMilestoneIndex())
                .isProforma(Boolean.TRUE.equals(proposal.getIsProforma()))
                .isTechnicalQuotation(Boolean.TRUE.equals(proposal.getIsTechnicalQuotation()))
                .showDiscount(proposal.getShowDiscount() == null || Boolean.TRUE.equals(proposal.getShowDiscount()))
                .hasBeenConverted(Boolean.TRUE.equals(proposal.getHasBeenConverted()))
                .parentProposalId(proposal.getParentProposalId())
                .parentTaxAmount(proposal.getParentTaxAmount())
                .milestoneIncludesGst(proposal.getMilestoneIncludesGst())
                .approverIds(proposal.getApproverIds() != null ? proposal.getApproverIds() : List.of())
                .approvedByIds(proposal.getApprovedByIds() != null ? proposal.getApprovedByIds() : List.of())
                .approvedByNames(proposal.getApprovedByNames() != null ? proposal.getApprovedByNames() : List.of())
                .subtotal(proposal.getSubtotal())
                .discountAmount(proposal.getDiscountAmount())
                .taxAmount(proposal.getTaxAmount())
                .totalAmount(proposal.getTotalAmount())
                .milestonePayableAmount(proposal.getMilestonePayableAmount())
                .status(proposal.getStatus())
                .sentAt(proposal.getSentAt())
                .acceptedAt(proposal.getAcceptedAt())
                .rejectedAt(proposal.getRejectedAt())
                .rejectionReason(proposal.getRejectionReason())
                .ownerId(proposal.getOwnerId())
                .ownerName(proposal.getOwnerName())
                .paymentTerms(proposal.getPaymentTerms())
                .deliveryTerms(proposal.getDeliveryTerms())
                .notes(proposal.getNotes())
                .createdAt(proposal.getCreatedAt())
                .createdBy(proposal.getCreatedBy())
                .createdByName(proposal.getCreatedByName())
                .lastModifiedAt(proposal.getLastModifiedAt())
                .lastModifiedBy(proposal.getLastModifiedBy())
                .lastModifiedByName(proposal.getLastModifiedByName())
                // New linkage fields
                .leadId(proposal.getLeadId())
                .leadName(proposal.getLeadName())
                .opportunityId(proposal.getOpportunityId())
                .opportunityName(proposal.getOpportunityName())
                .accountId(proposal.getAccountId())
                .accountName(proposal.getAccountName())
                .contactId(proposal.getContactId())
                .contactName(proposal.getContactName())
                .build();
    }

    private Proposal.CustomerAddress mapToAddress(AddressDTO dto) {
        if (dto == null) return null;
        return Proposal.CustomerAddress.builder()
                .name(dto.getName())
                .companyName(dto.getCompanyName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .street(dto.getStreet())
                .city(dto.getCity())
                .state(dto.getState())
                .postalCode(dto.getPostalCode())
                .country(dto.getCountry())
                .gstNumber(dto.getGstNumber())
                .build();
    }

    private List<Proposal.PaymentMilestone> mapMilestones(List<CreateProposalRequest.PaymentMilestoneDTO> dtos) {
        if (dtos == null) return null;
        return dtos.stream()
                .map(dto -> Proposal.PaymentMilestone.builder()
                        .name(dto.getName())
                        .percentage(dto.getPercentage())
                        .build())
                .collect(Collectors.toList());
    }

    private void generateNextMilestoneProposal(Proposal previousProposal, int nextIndex, String userId) {
        String newProposalId = proposalIdGeneratorService.generateProposalId();
        
        List<Proposal.ProposalLineItem> copiedLineItems = previousProposal.getLineItems().stream()
            .map(item -> Proposal.ProposalLineItem.builder()
                .lineItemId(UUID.randomUUID().toString())
                .productId(item.getProductId())
                .productName(item.getProductName())
                .sku(item.getSku())
                .description(item.getDescription())
                .quantity(item.getQuantity())
                .unit(item.getUnit())
                .hsnCode(item.getHsnCode())
                .unitPrice(item.getUnitPrice())
                .taxRate(item.getTaxRate())
                .discountType(item.getDiscountType())
                .discountValue(item.getDiscountValue())
                .build())
            .collect(Collectors.toList());

        Proposal nextProposal = Proposal.builder()
                .proposalId(newProposalId)
                .tenantId(previousProposal.getTenantId())
                .source(previousProposal.getSource())
                .sourceId(previousProposal.getSourceId())
                .sourceName(previousProposal.getSourceName())
                .proposalNumber(previousProposal.getProposalNumber() + "-M" + (nextIndex + 1))
                .title(previousProposal.getTitle() + " - Milestone " + (nextIndex + 1))
                .description(previousProposal.getDescription())
                .validUntil(java.time.LocalDate.now().plusDays(30))
                .billingAddress(previousProposal.getBillingAddress())
                .shippingAddress(previousProposal.getShippingAddress())
                .lineItems(copiedLineItems)
                .discount(previousProposal.getDiscount())
                .gstType(previousProposal.getGstType())
                .gstNumber(previousProposal.getGstNumber())
                .paymentMilestones(previousProposal.getPaymentMilestones())
                .currentMilestoneIndex(nextIndex)
                .parentProposalId(previousProposal.getId())
                .status(ProposalStatus.DRAFT)
                .ownerId(previousProposal.getOwnerId())
                .ownerName(previousProposal.getOwnerName())
                .paymentTerms(previousProposal.getPaymentTerms())
                .deliveryTerms(previousProposal.getDeliveryTerms())
                .notes(previousProposal.getNotes())
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(userId)
                .createdByName(getUserName(userId))
                // Explicit linkages
                .leadId(previousProposal.getLeadId())
                .leadName(previousProposal.getLeadName())
                .opportunityId(previousProposal.getOpportunityId())
                .opportunityName(previousProposal.getOpportunityName())
                .accountId(previousProposal.getAccountId())
                .accountName(previousProposal.getAccountName())
                .contactId(previousProposal.getContactId())
                .parentTaxAmount(previousProposal.getParentTaxAmount())
                .milestoneIncludesGst(previousProposal.getMilestoneIncludesGst())
                .contactName(previousProposal.getContactName())
                .build();
                
        // Calculate totals
        nextProposal = calculationService.calculateTotals(nextProposal);
        
        Proposal savedNext = proposalRepository.save(nextProposal);
        log.info("Auto-generated next milestone proposal: {}", savedNext.getId());
        
        // Log auditing and versioning
        auditLogService.logAsync("PROPOSAL", savedNext.getId(), savedNext.getTitle(),
                "CREATE", "Auto-generated milestone proposal",
                null, savedNext.getStatus().toString(),
                userId, null);
        proposalVersioningService.createSnapshot(savedNext, "CREATED", "Auto-generated next milestone", userId);
    }
    public InvoiceTemplateService getInvoiceTemplateService() {
        return invoiceTemplateService;
    }

    // ==================== PREMIUM FEATURES ====================

    /**
     * Returns the audit activity log for a given proposal.
     */
    public List<com.ultron.backend.domain.entity.AuditLog> getProposalActivity(String proposalId) {
        String tenantId = getCurrentTenantId();
        Proposal proposal = proposalRepository.findByIdAndTenantId(proposalId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found: " + proposalId));
        return auditLogRepository.findByEntityTypeAndEntityIdAndTenantIdOrderByTimestampDesc("PROPOSAL", proposal.getId(), tenantId);
    }

    /**
     * Returns linked documents: children if quotation, parent if proforma.
     */
    public List<ProposalResponse> getRelatedDocuments(String proposalId) {
        String tenantId = getCurrentTenantId();
        Proposal proposal = proposalRepository.findByIdAndTenantId(proposalId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found: " + proposalId));

        if (Boolean.TRUE.equals(proposal.getIsProforma()) && proposal.getParentProposalId() != null) {
            // This is a proforma: return parent quotation
            return proposalRepository.findByIdAndTenantId(proposal.getParentProposalId(), tenantId)
                    .map(p -> List.of(mapToResponse(p)))
                    .orElse(List.of());
        } else {
            // This is a quotation: return all child proformas
            return proposalRepository.findByParentProposalIdAndTenantId(proposal.getId(), tenantId)
                    .stream().map(this::mapToResponse).collect(Collectors.toList());
        }
    }

    /**
     * Voids a proforma invoice, optionally resetting the parent quotation's hasBeenConverted flag.
     */
    @Transactional
    public ProposalResponse voidProforma(String proposalId, String userId) {
        String tenantId = getCurrentTenantId();
        Proposal proposal = proposalRepository.findByIdAndTenantId(proposalId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found: " + proposalId));

        if (!Boolean.TRUE.equals(proposal.getIsProforma())) {
            throw new IllegalStateException("Only Proforma Invoices can be voided.");
        }
        if (proposal.getStatus() == ProposalStatus.VOIDED) {
            throw new IllegalStateException("This Proforma is already voided.");
        }

        proposal.setStatus(ProposalStatus.VOIDED);
        proposal.setLastModifiedAt(LocalDateTime.now());
        proposal.setLastModifiedBy(userId);

        // If parent quotation exists, check if all sibling proformas are voided and reset flag
        if (proposal.getParentProposalId() != null) {
            List<Proposal> siblings = proposalRepository.findByParentProposalIdAndTenantId(proposal.getParentProposalId(), tenantId);
            boolean allVoided = siblings.stream()
                    .filter(s -> !s.getId().equals(proposal.getId()))
                    .allMatch(s -> s.getStatus() == ProposalStatus.VOIDED);
            if (allVoided) {
                proposalRepository.findByIdAndTenantId(proposal.getParentProposalId(), tenantId).ifPresent(parent -> {
                    parent.setHasBeenConverted(false);
                    proposalRepository.save(parent);
                    log.info("Reset hasBeenConverted on parent quotation: {}", parent.getProposalId());
                });
            }
        }

        Proposal saved = proposalRepository.save(proposal);
        auditLogService.logAsync("PROPOSAL", saved.getId(), saved.getTitle(),
                "VOIDED", "Proforma Invoice voided",
                ProposalStatus.DRAFT.toString(), ProposalStatus.VOIDED.toString(),
                userId, null);
        return mapToResponse(saved);
    }
}
