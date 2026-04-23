package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.Proposal;
import com.ultron.backend.domain.entity.ServiceRequest;
import com.ultron.backend.domain.entity.WorkOrder;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.repository.ProposalRepository;
import com.ultron.backend.repository.ServiceRequestRepository;
import com.ultron.backend.repository.WorkOrderRepository;
import com.ultron.backend.service.PortalAuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/portal")
@RequiredArgsConstructor
@Slf4j
public class PortalController {

    private final PortalAuthService portalAuthService;
    private final ProposalRepository proposalRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final WorkOrderRepository workOrderRepository;

    @PostMapping("/auth/request-link")
    public ResponseEntity<ApiResponse<Map<String, String>>> requestLink(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String tenantId = body.get("tenantId");
        if (email == null || tenantId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.<Map<String, String>>builder()
                    .success(false).message("email and tenantId are required").build());
        }
        String token = portalAuthService.requestMagicLink(email, tenantId);
        return ResponseEntity.ok(ApiResponse.<Map<String, String>>builder()
                .success(true).message("Magic link sent (token: " + token + ")").build());
    }

    @PostMapping("/auth/verify")
    public ResponseEntity<ApiResponse<Map<String, String>>> verify(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        Map<String, String> result = portalAuthService.verifyMagicLink(token);
        return ResponseEntity.ok(ApiResponse.<Map<String, String>>builder()
                .success(true).data(result).build());
    }

    @GetMapping("/invoices")
    public ResponseEntity<ApiResponse<List<Proposal>>> getInvoices(HttpServletRequest request) {
        Map<String, Object> portalInfo = extractPortalInfo(request);
        String tenantId = (String) portalInfo.get("tenantId");
        List<Proposal> proposals = proposalRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        return ResponseEntity.ok(ApiResponse.<List<Proposal>>builder()
                .success(true).data(proposals).build());
    }

    @GetMapping("/service-requests")
    public ResponseEntity<ApiResponse<List<ServiceRequest>>> getServiceRequests(HttpServletRequest request) {
        Map<String, Object> portalInfo = extractPortalInfo(request);
        String tenantId = (String) portalInfo.get("tenantId");
        List<ServiceRequest> list = serviceRequestRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        return ResponseEntity.ok(ApiResponse.<List<ServiceRequest>>builder()
                .success(true).data(list).build());
    }

    @GetMapping("/work-orders")
    public ResponseEntity<ApiResponse<List<WorkOrder>>> getWorkOrders(HttpServletRequest request) {
        Map<String, Object> portalInfo = extractPortalInfo(request);
        String tenantId = (String) portalInfo.get("tenantId");
        List<WorkOrder> list = workOrderRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        return ResponseEntity.ok(ApiResponse.<List<WorkOrder>>builder()
                .success(true).data(list).build());
    }

    private Map<String, Object> extractPortalInfo(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Missing portal token");
        }
        return portalAuthService.validatePortalToken(authHeader.substring(7));
    }
}
