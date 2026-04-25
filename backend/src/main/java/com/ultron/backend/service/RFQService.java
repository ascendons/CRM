package com.ultron.backend.service;

import com.ultron.backend.domain.entity.*;
import com.ultron.backend.domain.enums.RFQStatus;
import com.ultron.backend.dto.request.ConvertRfqToPoRequest;
import com.ultron.backend.dto.request.CreateRFQRequest;
import com.ultron.backend.dto.request.RecordVendorResponseRequest;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RFQService extends BaseTenantService {

    private final RFQRepository rfqRepository;
    private final VendorRepository vendorRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ProposalRepository proposalRepository;
    private final ProposalIdGeneratorService idGeneratorService;

    // ── Create ────────────────────────────────────────────────────────────────

    public RFQ create(CreateRFQRequest request) {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();

        // Resolve vendor names
        List<String> vendorNames = resolveVendorNames(request.getVendorIds(), tenantId);

        // Resolve source reference number if linked to a proposal
        String sourceRefNumber = null;
        if (request.getSourceId() != null) {
            sourceRefNumber = proposalRepository.findByIdAndTenantId(request.getSourceId(), tenantId)
                    .map(p -> p.getReferenceNumber() != null ? p.getReferenceNumber() : p.getProposalNumber())
                    .orElse(null);
        }

        List<RFQ.RFQItem> items = request.getItems().stream().map(dto ->
                RFQ.RFQItem.builder()
                        .sourceLineItemIndex(dto.getSourceLineItemIndex())
                        .productId(dto.getProductId())
                        .productName(dto.getProductName())
                        .description(dto.getDescription())
                        .requestedQty(dto.getRequestedQty())
                        .unit(dto.getUnit())
                        .targetPrice(dto.getTargetPrice())
                        .sellUnitPrice(dto.getSellUnitPrice())
                        .build()
        ).collect(Collectors.toList());

        String rfqId = idGeneratorService.generateRfqReferenceNumber(tenantId);

        RFQ rfq = RFQ.builder()
                .rfqId(rfqId)
                .tenantId(tenantId)
                .title(request.getTitle() != null ? request.getTitle() : rfqId)
                .sourceType(request.getSourceType() != null ? request.getSourceType() : "STANDALONE")
                .sourceId(request.getSourceId())
                .sourceReferenceNumber(sourceRefNumber)
                .items(items)
                .vendorIds(request.getVendorIds())
                .vendorNames(vendorNames)
                .deadline(request.getDeadline())
                .notes(request.getNotes())
                .responses(new ArrayList<>())
                .status(request.isSendImmediately() ? RFQStatus.SENT : RFQStatus.DRAFT)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(userId)
                .build();

        rfq = rfqRepository.save(rfq);
        log.info("[Tenant: {}] RFQ created: {} linked to source: {}", tenantId, rfqId, request.getSourceId());
        return rfq;
    }

    // ── Send ──────────────────────────────────────────────────────────────────

    public RFQ send(String id) {
        RFQ rfq = findById(id);
        rfq.setStatus(RFQStatus.SENT);
        rfq.setUpdatedAt(LocalDateTime.now());
        rfq.setUpdatedBy(getCurrentUserId());
        return rfqRepository.save(rfq);
    }

    // ── Record vendor response ────────────────────────────────────────────────

    public RFQ recordVendorResponse(String id, RecordVendorResponseRequest request) {
        RFQ rfq = findById(id);

        String vendorName = vendorRepository.findById(request.getVendorId())
                .map(Vendor::getCompanyName).orElse(request.getVendorId());

        List<RFQ.LineQuote> lineQuotes = request.getLineQuotes().stream().map(lq ->
                RFQ.LineQuote.builder()
                        .sourceLineItemIndex(lq.getSourceLineItemIndex())
                        .quotedUnitPrice(lq.getQuotedUnitPrice())
                        .quotedQty(lq.getQuotedQty())
                        .build()
        ).collect(Collectors.toList());

        RFQ.VendorResponse response = RFQ.VendorResponse.builder()
                .vendorId(request.getVendorId())
                .vendorName(vendorName)
                .lineQuotes(lineQuotes)
                .deliveryDays(request.getDeliveryDays())
                .notes(request.getNotes())
                .respondedAt(LocalDateTime.now())
                .selected(false)
                .build();

        if (rfq.getResponses() == null) rfq.setResponses(new ArrayList<>());
        // Replace existing response from same vendor if any
        rfq.getResponses().removeIf(r -> r.getVendorId().equals(request.getVendorId()));
        rfq.getResponses().add(response);
        rfq.setStatus(RFQStatus.RESPONSE_RECEIVED);
        rfq.setUpdatedAt(LocalDateTime.now());
        rfq.setUpdatedBy(getCurrentUserId());
        return rfqRepository.save(rfq);
    }

    // ── Convert to PO ─────────────────────────────────────────────────────────

    public PurchaseOrder convertToPo(String rfqId, ConvertRfqToPoRequest request) {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();
        RFQ rfq = findById(rfqId);

        // Find vendor's response
        RFQ.VendorResponse vendorResponse = rfq.getResponses().stream()
                .filter(r -> r.getVendorId().equals(request.getVendorId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No response from vendor: " + request.getVendorId()));

        String vendorName = vendorRepository.findById(request.getVendorId())
                .map(Vendor::getCompanyName).orElse(request.getVendorId());

        // Build PO line items from selected RFQ items + vendor quoted prices
        List<PurchaseOrder.LineItem> poLines = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (int idx : request.getLineItemIndexes()) {
            RFQ.RFQItem rfqItem = rfq.getItems().stream()
                    .filter(i -> i.getSourceLineItemIndex() == idx)
                    .findFirst().orElse(null);
            if (rfqItem == null) continue;

            BigDecimal quotedPrice = vendorResponse.getLineQuotes().stream()
                    .filter(lq -> lq.getSourceLineItemIndex() == idx)
                    .map(RFQ.LineQuote::getQuotedUnitPrice)
                    .findFirst().orElse(BigDecimal.ZERO);

            int qty = rfqItem.getRequestedQty() != null ? rfqItem.getRequestedQty().intValue() : 0;
            BigDecimal lineTotal = quotedPrice.multiply(BigDecimal.valueOf(qty));
            subtotal = subtotal.add(lineTotal);

            poLines.add(PurchaseOrder.LineItem.builder()
                    .lineItemId(java.util.UUID.randomUUID().toString())
                    .productId(rfqItem.getProductId())
                    .productName(rfqItem.getProductName())
                    .description(rfqItem.getDescription())
                    .orderedQuantity(qty)
                    .receivedQuantity(0)
                    .unitPrice(quotedPrice)
                    .totalAmount(lineTotal)
                    .uom(rfqItem.getUnit())
                    .sourceLineItemIndex(rfqItem.getSourceLineItemIndex())
                    .sellUnitPrice(rfqItem.getSellUnitPrice())
                    .build());
        }

        String poId = idGeneratorService.generatePoReferenceNumber(tenantId);

        PurchaseOrder po = PurchaseOrder.builder()
                .tradingPoId(poId)
                .tenantId(tenantId)
                .sourceProposalId(rfq.getSourceId())
                .sourceReferenceNumber(rfq.getSourceReferenceNumber())
                .sourceRfqId(rfq.getId())
                .rfqReferenceNumber(rfq.getRfqId())
                .supplierId(request.getVendorId())
                .supplierName(vendorName)
                .status(PurchaseOrder.POStatus.SUBMITTED)
                .orderDate(LocalDate.now())
                .expectedDeliveryDate(request.getExpectedDeliveryDate())
                .items(poLines)
                .subtotal(subtotal)
                .totalAmount(subtotal)
                .notes(request.getNotes())
                .paymentTerms(request.getPaymentTerms())
                .approvalWorkflow(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .createdBy(userId)
                .build();

        PurchaseOrder savedPo = purchaseOrderRepository.save(po);

        // Mark vendor as selected on the RFQ
        vendorResponse.setSelected(true);
        rfq.setSelectedVendorId(request.getVendorId());
        rfq.setSelectedVendorName(vendorName);
        rfq.setStatus(RFQStatus.ACCEPTED);
        rfq.setUpdatedAt(LocalDateTime.now());
        rfq.setUpdatedBy(userId);
        rfqRepository.save(rfq);

        log.info("[Tenant: {}] PO {} created from RFQ {}", tenantId, poId, rfq.getRfqId());
        return savedPo;
    }

    // ── Cancel ────────────────────────────────────────────────────────────────

    public RFQ cancel(String id) {
        RFQ rfq = findById(id);
        rfq.setStatus(RFQStatus.CANCELLED);
        rfq.setUpdatedAt(LocalDateTime.now());
        rfq.setUpdatedBy(getCurrentUserId());
        return rfqRepository.save(rfq);
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    public List<RFQ> getAll() {
        return rfqRepository.findByTenantIdAndIsDeletedFalse(getCurrentTenantId());
    }

    public List<RFQ> getByStatus(RFQStatus status) {
        return rfqRepository.findByTenantIdAndStatusAndIsDeletedFalse(getCurrentTenantId(), status);
    }

    public RFQ getById(String id) {
        return findById(id);
    }

    public List<RFQ> getBySourceProposal(String sourceId) {
        return rfqRepository.findByTenantIdAndSourceIdAndIsDeletedFalse(getCurrentTenantId(), sourceId);
    }

    public void delete(String id) {
        RFQ rfq = findById(id);
        rfq.setDeleted(true);
        rfq.setUpdatedAt(LocalDateTime.now());
        rfq.setUpdatedBy(getCurrentUserId());
        rfqRepository.save(rfq);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private RFQ findById(String id) {
        return rfqRepository.findByIdAndTenantIdAndIsDeletedFalse(id, getCurrentTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found: " + id));
    }

    private List<String> resolveVendorNames(List<String> vendorIds, String tenantId) {
        if (vendorIds == null) return new ArrayList<>();
        return vendorIds.stream()
                .map(vid -> vendorRepository.findById(vid)
                        .map(Vendor::getCompanyName).orElse(vid))
                .collect(Collectors.toList());
    }
}
