package com.ultron.backend.controller;

import com.ultron.backend.dto.request.CreateServiceRequestRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.ServiceRequestResponse;
import com.ultron.backend.service.ServiceRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/service-requests")
@RequiredArgsConstructor
@Slf4j
public class ServiceRequestController {

    private final ServiceRequestService srService;

    @PostMapping
    @PreAuthorize("hasPermission('SERVICE_REQUESTS', 'CREATE')")
    public ResponseEntity<ApiResponse<ServiceRequestResponse>> create(
            @Valid @RequestBody CreateServiceRequestRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Service request created", srService.create(request, getCurrentUserId())));
    }

    @GetMapping
    @PreAuthorize("hasPermission('SERVICE_REQUESTS', 'READ')")
    public ResponseEntity<ApiResponse<List<ServiceRequestResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success("Service requests retrieved", srService.getAll()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('SERVICE_REQUESTS', 'READ')")
    public ResponseEntity<ApiResponse<ServiceRequestResponse>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Service request retrieved", srService.getById(id)));
    }

    @PostMapping("/{id}/acknowledge")
    @PreAuthorize("hasPermission('SERVICE_REQUESTS', 'EDIT')")
    public ResponseEntity<ApiResponse<ServiceRequestResponse>> acknowledge(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Service request acknowledged",
                srService.acknowledge(id, getCurrentUserId())));
    }

    @PostMapping("/{id}/link-work-order")
    @PreAuthorize("hasPermission('SERVICE_REQUESTS', 'EDIT')")
    public ResponseEntity<ApiResponse<ServiceRequestResponse>> linkWorkOrder(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success("Work order linked",
                srService.linkWorkOrder(id, body.get("workOrderId"), getCurrentUserId())));
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasPermission('SERVICE_REQUESTS', 'CLOSE')")
    public ResponseEntity<ApiResponse<ServiceRequestResponse>> resolve(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Service request resolved",
                srService.resolve(id, getCurrentUserId())));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasPermission('SERVICE_REQUESTS', 'CLOSE')")
    public ResponseEntity<ApiResponse<ServiceRequestResponse>> close(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Service request closed",
                srService.close(id, getCurrentUserId())));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : null;
    }
}
