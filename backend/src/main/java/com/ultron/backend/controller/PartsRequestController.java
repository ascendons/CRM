package com.ultron.backend.controller;

import com.ultron.backend.domain.enums.PartsRequestStatus;
import com.ultron.backend.dto.request.CreatePartsRequestRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.PartsRequestResponse;
import com.ultron.backend.service.PartsRequestService;
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
@RequestMapping("/parts-requests")
@RequiredArgsConstructor
@Slf4j
public class PartsRequestController {

    private final PartsRequestService partsRequestService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PartsRequestResponse>> create(
            @Valid @RequestBody CreatePartsRequestRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Parts request created",
                        partsRequestService.create(request, getCurrentUserId())));
    }

    @GetMapping
    @PreAuthorize("hasPermission('WORK_ORDERS', 'READ')")
    public ResponseEntity<ApiResponse<List<PartsRequestResponse>>> getAll(
            @RequestParam(required = false) PartsRequestStatus status,
            @RequestParam(required = false) String workOrderId) {
        List<PartsRequestResponse> result;
        if (workOrderId != null) {
            result = partsRequestService.getByWorkOrder(workOrderId);
        } else if (status != null) {
            result = partsRequestService.getByStatus(status);
        } else {
            result = partsRequestService.getAll();
        }
        return ResponseEntity.ok(ApiResponse.success("Parts requests retrieved", result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PartsRequestResponse>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Parts request retrieved",
                partsRequestService.getById(id)));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasPermission('PROCUREMENT', 'APPROVE')")
    public ResponseEntity<ApiResponse<PartsRequestResponse>> approve(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body) {
        String warehouseId = body != null ? body.get("warehouseId") : null;
        return ResponseEntity.ok(ApiResponse.success("Parts request approved",
                partsRequestService.approve(id, warehouseId, getCurrentUserId())));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasPermission('PROCUREMENT', 'APPROVE')")
    public ResponseEntity<ApiResponse<PartsRequestResponse>> reject(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success("Parts request rejected",
                partsRequestService.reject(id, body.get("reason"), getCurrentUserId())));
    }

    @PostMapping("/{id}/dispatch")
    @PreAuthorize("hasPermission('PROCUREMENT', 'APPROVE')")
    public ResponseEntity<ApiResponse<PartsRequestResponse>> dispatch(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Parts dispatched",
                partsRequestService.dispatch(id, getCurrentUserId())));
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PartsRequestResponse>> receive(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Parts received",
                partsRequestService.receive(id, getCurrentUserId())));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : null;
    }
}
