package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.EscalationLog;
import com.ultron.backend.domain.entity.EscalationRule;
import com.ultron.backend.dto.request.CreateEscalationRuleRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.multitenancy.TenantContext;
import com.ultron.backend.service.EscalationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/settings/escalation")
@RequiredArgsConstructor
public class EscalationController {

    private final EscalationService escalationService;

    @PostMapping("/rules")
    @PreAuthorize("hasPermission('ESCALATION', 'CREATE')")
    public ResponseEntity<ApiResponse<EscalationRule>> createRule(@RequestBody CreateEscalationRuleRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Escalation rule created",
                escalationService.createRule(request, getTenantId(), getUserId())));
    }

    @GetMapping("/rules")
    @PreAuthorize("hasPermission('ESCALATION', 'VIEW')")
    public ResponseEntity<ApiResponse<List<EscalationRule>>> getRules() {
        return ResponseEntity.ok(ApiResponse.success("Escalation rules retrieved",
                escalationService.getRules(getTenantId())));
    }

    @PutMapping("/rules/{id}")
    @PreAuthorize("hasPermission('ESCALATION', 'EDIT')")
    public ResponseEntity<ApiResponse<EscalationRule>> updateRule(@PathVariable String id,
                                                                   @RequestBody CreateEscalationRuleRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Escalation rule updated",
                escalationService.updateRule(id, request, getTenantId(), getUserId())));
    }

    @DeleteMapping("/rules/{id}")
    @PreAuthorize("hasPermission('ESCALATION', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteRule(@PathVariable String id) {
        escalationService.deleteRule(id, getTenantId(), getUserId());
        return ResponseEntity.ok(ApiResponse.success("Escalation rule deleted", null));
    }

    @GetMapping("/logs")
    @PreAuthorize("hasPermission('ESCALATION', 'VIEW')")
    public ResponseEntity<ApiResponse<List<EscalationLog>>> getLogs() {
        return ResponseEntity.ok(ApiResponse.success("Escalation logs retrieved",
                escalationService.getLogs(getTenantId())));
    }

    @GetMapping("/logs/open")
    @PreAuthorize("hasPermission('ESCALATION', 'VIEW')")
    public ResponseEntity<ApiResponse<List<EscalationLog>>> getOpenEscalations() {
        return ResponseEntity.ok(ApiResponse.success("Open escalations retrieved",
                escalationService.getOpenEscalations(getTenantId())));
    }

    @PostMapping("/logs/{logId}/acknowledge")
    @PreAuthorize("hasPermission('ESCALATION', 'EDIT')")
    public ResponseEntity<ApiResponse<EscalationLog>> acknowledge(@PathVariable String logId) {
        return ResponseEntity.ok(ApiResponse.success("Escalation acknowledged",
                escalationService.acknowledge(logId, getTenantId(), getUserId())));
    }

    @PostMapping("/logs/{logId}/resolve")
    @PreAuthorize("hasPermission('ESCALATION', 'EDIT')")
    public ResponseEntity<ApiResponse<EscalationLog>> resolve(@PathVariable String logId) {
        return ResponseEntity.ok(ApiResponse.success("Escalation resolved",
                escalationService.resolve(logId, getTenantId())));
    }

    private String getTenantId() {
        return TenantContext.getTenantId();
    }

    private String getUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : null;
    }
}
