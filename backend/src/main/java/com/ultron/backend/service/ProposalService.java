package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Lead;
import com.ultron.backend.domain.entity.Opportunity;
import com.ultron.backend.domain.entity.Product;
import com.ultron.backend.domain.entity.Proposal;
import com.ultron.backend.domain.enums.ProposalSource;
import com.ultron.backend.domain.enums.ProposalStatus;
import com.ultron.backend.dto.request.CreateProposalRequest;
import com.ultron.backend.dto.request.UpdateProposalRequest;
import com.ultron.backend.dto.response.ProposalResponse;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.LeadRepository;
import com.ultron.backend.repository.OpportunityRepository;
import com.ultron.backend.repository.ProductRepository;
import com.ultron.backend.repository.ProposalRepository;
import com.ultron.backend.repository.ProposalRepository;
import com.ultron.backend.repository.UserRepository;
import com.ultron.backend.repository.DynamicProductRepository;
import com.ultron.backend.domain.entity.DynamicProduct;
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
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProposalService {

    private final ProposalRepository proposalRepository;
    private final ProposalIdGeneratorService proposalIdGeneratorService;
    private final ProposalCalculationService calculationService;
    private final ProductRepository productRepository;
    private final LeadRepository leadRepository;
    private final OpportunityRepository opportunityRepository;
    private final DynamicProductRepository dynamicProductRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Transactional
    public ProposalResponse createProposal(CreateProposalRequest request, String createdBy) {
        // Validate source (Lead or Opportunity)
        validateSource(request.getSource(), request.getSourceId());

        // Get source name
        String sourceName = getSourceName(request.getSource(), request.getSourceId());

        // Build line items with product validation
        List<Proposal.ProposalLineItem> lineItems = this.buildCreateLineItems(request.getLineItems());

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
                .source(request.getSource())
                .sourceId(request.getSourceId())
                .sourceName(sourceName)
                .proposalNumber(proposalId)  // Same as proposalId for now
                .title(request.getTitle())
                .description(request.getDescription())
                .validUntil(request.getValidUntil())
                .lineItems(lineItems)
                .discount(discount)
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

        // Calculate totals
        proposal = calculationService.calculateTotals(proposal);

        // Save
        Proposal saved = proposalRepository.save(proposal);

        log.info("Proposal created: proposalId={}, source={}, sourceId={}, total={}",
                 saved.getProposalId(), saved.getSource(), saved.getSourceId(), saved.getTotalAmount());

        // Log audit event
        auditLogService.logAsync("PROPOSAL", saved.getId(), saved.getTitle(),
                "CREATED", "Proposal created with status DRAFT",
                null, ProposalStatus.DRAFT.toString(),
                createdBy, null);

        return mapToResponse(saved);
    }

    @Transactional
    public ProposalResponse updateProposal(String id, UpdateProposalRequest request, String userId) {
        Proposal proposal = findProposalById(id);

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

        if (request.getLineItems() != null) {
            List<Proposal.ProposalLineItem> lineItems = buildUpdateLineItems(request.getLineItems());
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

        if (request.getPaymentTerms() != null) {
            proposal.setPaymentTerms(request.getPaymentTerms());
        }

        if (request.getDeliveryTerms() != null) {
            proposal.setDeliveryTerms(request.getDeliveryTerms());
        }

        if (request.getNotes() != null) {
            proposal.setNotes(request.getNotes());
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

        // Log audit event
        auditLogService.logAsync("PROPOSAL", saved.getId(), saved.getTitle(),
                "UPDATED", "Proposal details updated",
                null, null,
                userId, null);

        return mapToResponse(saved);
    }

    @Transactional
    public ProposalResponse sendProposal(String id, String userId) {
        Proposal proposal = findProposalById(id);

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

        // Log audit event
        auditLogService.logAsync("PROPOSAL", saved.getId(), saved.getTitle(),
                "SENT", "Proposal sent to customer",
                oldStatus.toString(), ProposalStatus.SENT.toString(),
                userId, null);

        // TODO: Send email notification to customer

        return mapToResponse(saved);
    }

    @Transactional
    public ProposalResponse acceptProposal(String id, String userId) {
        Proposal proposal = findProposalById(id);

        if (proposal.getStatus() != ProposalStatus.SENT) {
            throw new IllegalStateException("Only sent proposals can be accepted");
        }

        ProposalStatus oldStatus = proposal.getStatus();
        proposal.setStatus(ProposalStatus.ACCEPTED);
        proposal.setAcceptedAt(LocalDateTime.now());
        proposal.setLastModifiedAt(LocalDateTime.now());
        proposal.setLastModifiedBy(userId);
        proposal.setLastModifiedByName(getUserName(userId));

        Proposal saved = proposalRepository.save(proposal);

        log.info("Proposal accepted: proposalId={}, acceptedBy={}", saved.getProposalId(), userId);

        // Log audit event
        auditLogService.logAsync("PROPOSAL", saved.getId(), saved.getTitle(),
                "ACCEPTED", "Proposal accepted by customer",
                oldStatus.toString(), ProposalStatus.ACCEPTED.toString(),
                userId, null);

        // TODO: Auto-create Opportunity if source is LEAD
        // TODO: Update Opportunity stage if source is OPPORTUNITY

        return mapToResponse(saved);
    }

    @Transactional
    public ProposalResponse rejectProposal(String id, String reason, String userId) {
        Proposal proposal = findProposalById(id);

        if (proposal.getStatus() != ProposalStatus.SENT) {
            throw new IllegalStateException("Only sent proposals can be rejected");
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

        // Log audit event with rejection reason
        auditLogService.logAsync("PROPOSAL", saved.getId(), saved.getTitle(),
                "REJECTED", "Proposal rejected by customer. Reason: " + reason,
                oldStatus.toString(), ProposalStatus.REJECTED.toString(),
                userId, java.util.Map.of("reason", reason));

        return mapToResponse(saved);
    }

    public List<ProposalResponse> getAllProposals() {
        return proposalRepository.findByIsDeletedFalse().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<ProposalResponse> getAllProposals(Pageable pageable) {
        return proposalRepository.findByIsDeletedFalse(pageable)
                .map(this::mapToResponse);
    }

    public ProposalResponse getProposalById(String id) {
        Proposal proposal = findProposalById(id);
        return mapToResponse(proposal);
    }

    public List<ProposalResponse> getProposalsBySource(ProposalSource source, String sourceId) {
        return proposalRepository.findBySourceAndSourceIdAndIsDeletedFalse(source, sourceId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<ProposalResponse> getProposalsBySource(ProposalSource source, String sourceId, Pageable pageable) {
        return proposalRepository.findBySourceAndSourceIdAndIsDeletedFalse(source, sourceId, pageable)
                .map(this::mapToResponse);
    }

    public List<ProposalResponse> getProposalsByStatus(ProposalStatus status) {
        return proposalRepository.findByStatusAndIsDeletedFalse(status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<ProposalResponse> getProposalsByStatus(ProposalStatus status, Pageable pageable) {
        return proposalRepository.findByStatusAndIsDeletedFalse(status, pageable)
                .map(this::mapToResponse);
    }

    public List<ProposalResponse> getProposalsByOwner(String ownerId) {
        return proposalRepository.findByOwnerIdAndIsDeletedFalse(ownerId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<ProposalResponse> getProposalsByOwner(String ownerId, Pageable pageable) {
        return proposalRepository.findByOwnerIdAndIsDeletedFalse(ownerId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional
    public void deleteProposal(String id, String deletedBy) {
        Proposal proposal = findProposalById(id);

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

    private Proposal findProposalById(String id) {
        Proposal proposal = proposalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found with id: " + id));

        if (proposal.getIsDeleted()) {
            throw new ResourceNotFoundException("Proposal not found with id: " + id);
        }

        return proposal;
    }

    private List<Proposal.ProposalLineItem> buildCreateLineItems(List<CreateProposalRequest.LineItemDTO> dtos) {
        return dtos.stream().map(dto -> {
            // Try standard product first
            return productRepository.findById(dto.getProductId())
                    .map(product -> Proposal.ProposalLineItem.builder()
                            .lineItemId(UUID.randomUUID().toString())
                            .productId(product.getId())
                            .productName(product.getProductName())
                            .sku(product.getSku())
                            .description(dto.getDescription() != null ? dto.getDescription() : product.getDescription())
                            .quantity(dto.getQuantity())
                            .unit(product.getUnit())
                            .unitPrice(dto.getUnitPrice() != null ? dto.getUnitPrice() : product.getBasePrice())
                            .taxRate(product.getTaxRate())
                            .discountType(dto.getDiscountType())
                            .discountValue(dto.getDiscountValue())
                            .build())
                    .orElseGet(() -> {
                        // Try dynamic product
                        DynamicProduct dynamicProduct = dynamicProductRepository.findById(dto.getProductId())
                                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + dto.getProductId()));

                        return mapDynamicProductToLineItem(dynamicProduct, dto);
                    });
        }).collect(Collectors.toList());
    }

    private Proposal.ProposalLineItem mapDynamicProductToLineItem(DynamicProduct product, CreateProposalRequest.LineItemDTO dto) {
        return Proposal.ProposalLineItem.builder()
                .lineItemId(UUID.randomUUID().toString())
                .productId(product.getId())
                .productName(product.getDisplayName() != null ? product.getDisplayName() : "Unknown Product")
                .sku(product.getProductId()) // Use business ID as SKU
                .description(dto.getDescription() != null ? dto.getDescription() : findAttributeValue(product, "description", null))
                .quantity(dto.getQuantity())
                .unit(findAttributeValue(product, "unit", "pcs"))
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
                .productName(product.getDisplayName() != null ? product.getDisplayName() : "Unknown Product")
                .sku(product.getProductId()) // Use business ID as SKU
                .description(dto.getDescription() != null ? dto.getDescription() : findAttributeValue(product, "description", null))
                .quantity(dto.getQuantity())
                .unit(findAttributeValue(product, "unit", "pcs"))
                .unitPrice(dto.getUnitPrice() != null ? dto.getUnitPrice() : BigDecimal.valueOf(findAttributeNumericValue(product, "price", 0.0)))
                .taxRate(BigDecimal.valueOf(findAttributeNumericValue(product, "tax", 0.0)))
                .discountType(dto.getDiscountType())
                .discountValue(dto.getDiscountValue())
                .build();
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

    private List<Proposal.ProposalLineItem> buildUpdateLineItems(List<UpdateProposalRequest.LineItemDTO> dtos) {
        return dtos.stream().map(dto -> {
            // Try standard product first
            return productRepository.findById(dto.getProductId())
                    .map(product -> Proposal.ProposalLineItem.builder()
                            .lineItemId(UUID.randomUUID().toString())
                            .productId(product.getId())
                            .productName(product.getProductName())
                            .sku(product.getSku())
                            .description(dto.getDescription() != null ? dto.getDescription() : product.getDescription())
                            .quantity(dto.getQuantity())
                            .unit(product.getUnit())
                            .unitPrice(dto.getUnitPrice() != null ? dto.getUnitPrice() : product.getBasePrice())
                            .taxRate(product.getTaxRate())
                            .discountType(dto.getDiscountType())
                            .discountValue(dto.getDiscountValue())
                            .build())
                    .orElseGet(() -> {
                        // Try dynamic product
                        DynamicProduct dynamicProduct = dynamicProductRepository.findById(dto.getProductId())
                                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + dto.getProductId()));

                        return mapDynamicProductToLineItem(dynamicProduct, dto);
                    });
        }).collect(Collectors.toList());
    }

    private void validateSource(ProposalSource source, String sourceId) {
        if (source == ProposalSource.LEAD) {
            leadRepository.findById(sourceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Lead not found: " + sourceId));
        } else {
            opportunityRepository.findById(sourceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found: " + sourceId));
        }
    }

    private String getSourceName(ProposalSource source, String sourceId) {
        if (source == ProposalSource.LEAD) {
            Lead lead = leadRepository.findById(sourceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Lead not found: " + sourceId));
            return lead.getFirstName() + " " + lead.getLastName();
        } else {
            Opportunity opportunity = opportunityRepository.findById(sourceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found: " + sourceId));
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
                .subtotal(proposal.getSubtotal())
                .discountAmount(proposal.getDiscountAmount())
                .taxAmount(proposal.getTaxAmount())
                .totalAmount(proposal.getTotalAmount())
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
                .build();
    }
}
