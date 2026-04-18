package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.PurchaseOrder;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.multitenancy.TenantContext;
import com.ultron.backend.service.PurchaseOrderApprovalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/procurement/purchase-orders")
@RequiredArgsConstructor
public class PurchaseOrderApprovalController {

    private final PurchaseOrderApprovalService approvalService;

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasPermission('PURCHASE_ORDER', 'EDIT')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> submit(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("PO submitted for approval",
                approvalService.submitForApproval(id)));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasPermission('PURCHASE_ORDER', 'APPROVE')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> approve(
            @PathVariable String id,
            @RequestParam String level,
            @RequestBody(required = false) Map<String, String> body) {
        String comments = body != null ? body.get("comments") : null;
        return ResponseEntity.ok(ApiResponse.success("PO approved at level " + level,
                approvalService.approve(id, level, comments)));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasPermission('PURCHASE_ORDER', 'APPROVE')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> reject(
            @PathVariable String id,
            @RequestParam String level,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success("PO rejected",
                approvalService.reject(id, level, body.get("reason"))));
    }

    @GetMapping("/pending-approval")
    @PreAuthorize("hasPermission('PURCHASE_ORDER', 'VIEW')")
    public ResponseEntity<ApiResponse<List<PurchaseOrder>>> getPendingApprovals() {
        return ResponseEntity.ok(ApiResponse.success("Pending approvals retrieved",
                approvalService.getPendingApprovals()));
    }

    private String getTenantId() {
        return TenantContext.getTenantId();
    }

    private String getUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : null;
    }
}
