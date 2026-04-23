package com.ultron.backend.controller;

import com.ultron.backend.domain.enums.WorkOrderStatus;
import com.ultron.backend.dto.request.CreateWorkOrderRequest;
import com.ultron.backend.dto.request.UpdateWorkOrderRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.WorkOrderResponse;
import com.ultron.backend.service.WorkOrderService;
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
@RequestMapping("/work-orders")
@RequiredArgsConstructor
@Slf4j
public class WorkOrderController {

    private final WorkOrderService workOrderService;

    @PostMapping
    @PreAuthorize("hasPermission('WORK_ORDERS', 'CREATE')")
    public ResponseEntity<ApiResponse<WorkOrderResponse>> create(
            @Valid @RequestBody CreateWorkOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Work order created", workOrderService.create(request, getCurrentUserId())));
    }

    @GetMapping
    @PreAuthorize("hasPermission('WORK_ORDERS', 'READ')")
    public ResponseEntity<ApiResponse<List<WorkOrderResponse>>> getAll(
            @RequestParam(required = false) WorkOrderStatus status,
            @RequestParam(required = false) String engineerId,
            @RequestParam(required = false) String assetId,
            @RequestParam(required = false) Boolean slaBreached) {

        List<WorkOrderResponse> result;
        if (slaBreached != null && slaBreached) {
            result = workOrderService.getSlaBreached();
        } else if (assetId != null) {
            result = workOrderService.getByAsset(assetId);
        } else if (status != null) {
            result = workOrderService.getByStatus(status);
        } else if (engineerId != null) {
            result = workOrderService.getByEngineer(engineerId);
        } else {
            result = workOrderService.getAll();
        }
        return ResponseEntity.ok(ApiResponse.success("Work orders retrieved", result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('WORK_ORDERS', 'READ')")
    public ResponseEntity<ApiResponse<WorkOrderResponse>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Work order retrieved", workOrderService.getById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('WORK_ORDERS', 'EDIT')")
    public ResponseEntity<ApiResponse<WorkOrderResponse>> update(
            @PathVariable String id,
            @Valid @RequestBody UpdateWorkOrderRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Work order updated",
                workOrderService.update(id, request, getCurrentUserId())));
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasPermission('WORK_ORDERS', 'ASSIGN')")
    public ResponseEntity<ApiResponse<WorkOrderResponse>> assign(
            @PathVariable String id,
            @RequestBody Map<String, List<String>> body) {
        List<String> engineerIds = body.get("engineerIds");
        return ResponseEntity.ok(ApiResponse.success("Work order assigned",
                workOrderService.assign(id, engineerIds, getCurrentUserId())));
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasPermission('WORK_ORDERS', 'EDIT')")
    public ResponseEntity<ApiResponse<WorkOrderResponse>> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        WorkOrderStatus newStatus = WorkOrderStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(ApiResponse.success("Work order status updated",
                workOrderService.updateStatus(id, newStatus, getCurrentUserId())));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasPermission('WORK_ORDERS', 'CLOSE')")
    public ResponseEntity<ApiResponse<WorkOrderResponse>> close(
            @PathVariable String id,
            @RequestBody UpdateWorkOrderRequest request) {
        request.setStatus(WorkOrderStatus.COMPLETED);
        return ResponseEntity.ok(ApiResponse.success("Work order closed",
                workOrderService.update(id, request, getCurrentUserId())));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('WORK_ORDERS', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        workOrderService.delete(id, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Work order deleted", null));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : null;
    }
}
