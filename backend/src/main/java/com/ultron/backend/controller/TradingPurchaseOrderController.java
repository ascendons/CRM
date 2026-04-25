package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.PurchaseOrder;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.multitenancy.TenantContext;
import com.ultron.backend.repository.PurchaseOrderRepository;
import com.ultron.backend.service.PurchaseOrderApprovalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * REST controller for trading-workflow Purchase Orders (sourced via RFQ from sales proposals).
 * Complements the existing /procurement/purchase-orders inventory controller.
 */
@RestController
@RequestMapping("/purchase-orders")
@RequiredArgsConstructor
@Slf4j
public class TradingPurchaseOrderController {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderApprovalService approvalService;

    /** All POs for this tenant (trading flow only = those with a tradingPoId) */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<PurchaseOrder>>> getAll() {
        String tenantId = TenantContext.getTenantId();
        List<PurchaseOrder> all = purchaseOrderRepository.findByTenantId(tenantId);
        List<PurchaseOrder> trading = all.stream()
                .filter(po -> po.getTradingPoId() != null)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Purchase orders retrieved", trading));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PurchaseOrder>> getById(@PathVariable String id) {
        String tenantId = TenantContext.getTenantId();
        PurchaseOrder po = purchaseOrderRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found: " + id));
        return ResponseEntity.ok(ApiResponse.success("Purchase order retrieved", po));
    }

    /** All POs linked to a source proposal */
    @GetMapping("/by-proposal/{proposalId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<PurchaseOrder>>> getByProposal(@PathVariable String proposalId) {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(ApiResponse.success("Purchase orders retrieved",
                purchaseOrderRepository.findByTenantIdAndSourceProposalId(tenantId, proposalId)));
    }

    /** All POs linked to a specific RFQ */
    @GetMapping("/by-rfq/{rfqId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<PurchaseOrder>>> getByRfq(@PathVariable String rfqId) {
        String tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(ApiResponse.success("Purchase orders retrieved",
                purchaseOrderRepository.findByTenantIdAndSourceRfqId(tenantId, rfqId)));
    }

    /** Submit a trading PO for admin approval */
    @PostMapping("/{id}/submit")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PurchaseOrder>> submit(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("PO submitted for approval",
                approvalService.submitForApproval(id)));
    }

    /** Admin approve */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> approve(
            @PathVariable String id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success("PO approved",
                approvalService.approve(id, body.getOrDefault("level", "L1"),
                        body.getOrDefault("comments", ""))));
    }

    /** Admin reject */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> reject(
            @PathVariable String id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success("PO rejected",
                approvalService.reject(id, body.getOrDefault("level", "L1"),
                        body.getOrDefault("reason", ""))));
    }

    /** Mark PO as sent to vendor */
    @PostMapping("/{id}/send")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PurchaseOrder>> send(@PathVariable String id) {
        String tenantId = TenantContext.getTenantId();
        PurchaseOrder po = purchaseOrderRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found: " + id));
        po.setStatus(PurchaseOrder.POStatus.SENT);
        po.setLastModifiedAt(LocalDateTime.now());
        return ResponseEntity.ok(ApiResponse.success("PO sent to vendor",
                purchaseOrderRepository.save(po)));
    }

    /** Mark PO as received */
    @PostMapping("/{id}/receive")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PurchaseOrder>> receive(@PathVariable String id) {
        String tenantId = TenantContext.getTenantId();
        PurchaseOrder po = purchaseOrderRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found: " + id));
        po.setStatus(PurchaseOrder.POStatus.RECEIVED);
        po.setReceivedDate(java.time.LocalDate.now());
        po.setLastModifiedAt(LocalDateTime.now());
        return ResponseEntity.ok(ApiResponse.success("PO marked as received",
                purchaseOrderRepository.save(po)));
    }

    /** Cancel PO */
    @PostMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PurchaseOrder>> cancel(@PathVariable String id) {
        String tenantId = TenantContext.getTenantId();
        PurchaseOrder po = purchaseOrderRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found: " + id));
        po.setStatus(PurchaseOrder.POStatus.CANCELLED);
        po.setLastModifiedAt(LocalDateTime.now());
        return ResponseEntity.ok(ApiResponse.success("PO cancelled",
                purchaseOrderRepository.save(po)));
    }
}
