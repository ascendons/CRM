package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.DealerOrder;
import com.ultron.backend.domain.entity.DealerPerformance;
import com.ultron.backend.domain.enums.DealerStatus;
import com.ultron.backend.domain.enums.DealerTier;
import com.ultron.backend.dto.request.CreateDealerOrderRequest;
import com.ultron.backend.dto.request.CreateDealerRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.DealerResponse;
import com.ultron.backend.service.DealerPerformanceService;
import com.ultron.backend.service.DealerService;
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
@RequestMapping("/dealers")
@RequiredArgsConstructor
@Slf4j
public class DealerController {

    private final DealerService dealerService;
    private final DealerPerformanceService dealerPerformanceService;

    @PostMapping
    @PreAuthorize("hasPermission('DEALERS', 'CREATE')")
    public ResponseEntity<ApiResponse<DealerResponse>> create(@Valid @RequestBody CreateDealerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Dealer created", dealerService.create(request, getCurrentUserId())));
    }

    @GetMapping
    @PreAuthorize("hasPermission('DEALERS', 'READ')")
    public ResponseEntity<ApiResponse<List<DealerResponse>>> getAll(
            @RequestParam(required = false) DealerStatus status,
            @RequestParam(required = false) DealerTier tier,
            @RequestParam(required = false) String territory) {
        List<DealerResponse> result;
        if (territory != null) result = dealerService.getByTerritory(territory);
        else if (tier != null) result = dealerService.getByTier(tier);
        else if (status != null) result = dealerService.getByStatus(status);
        else result = dealerService.getAll();
        return ResponseEntity.ok(ApiResponse.success("Dealers retrieved", result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('DEALERS', 'READ')")
    public ResponseEntity<ApiResponse<DealerResponse>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Dealer retrieved", dealerService.getById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('DEALERS', 'EDIT')")
    public ResponseEntity<ApiResponse<DealerResponse>> update(
            @PathVariable String id, @RequestBody CreateDealerRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Dealer updated",
                dealerService.update(id, request, getCurrentUserId())));
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasPermission('DEALERS', 'EDIT')")
    public ResponseEntity<ApiResponse<DealerResponse>> updateStatus(
            @PathVariable String id, @RequestBody Map<String, String> body) {
        DealerStatus status = DealerStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(ApiResponse.success("Dealer status updated",
                dealerService.updateStatus(id, status, getCurrentUserId())));
    }

    @PostMapping("/{id}/orders")
    @PreAuthorize("hasPermission('DEALERS', 'CREATE')")
    public ResponseEntity<ApiResponse<DealerOrder>> createOrder(
            @PathVariable String id, @Valid @RequestBody CreateDealerOrderRequest request) {
        request.setDealerId(id);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Dealer order created",
                        dealerService.createOrder(request, getCurrentUserId())));
    }

    @GetMapping("/{id}/orders")
    @PreAuthorize("hasPermission('DEALERS', 'READ')")
    public ResponseEntity<ApiResponse<List<DealerOrder>>> getOrders(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Dealer orders retrieved",
                dealerService.getOrdersByDealer(id)));
    }

    @GetMapping("/{id}/performance")
    @PreAuthorize("hasPermission('DEALERS', 'READ')")
    public ResponseEntity<ApiResponse<DealerPerformance>> getPerformance(
            @PathVariable String id,
            @RequestParam int month,
            @RequestParam int year) {
        return ResponseEntity.ok(ApiResponse.success("Dealer performance retrieved",
                dealerPerformanceService.getPerformance(id, month, year)));
    }

    @GetMapping("/performance/monthly")
    @PreAuthorize("hasPermission('DEALERS', 'READ')")
    public ResponseEntity<ApiResponse<List<DealerPerformance>>> getMonthlyPerformance(
            @RequestParam int month,
            @RequestParam int year) {
        return ResponseEntity.ok(ApiResponse.success("Monthly dealer performance retrieved",
                dealerPerformanceService.getAllForMonth(month, year)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('DEALERS', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        dealerService.delete(id, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Dealer deleted", null));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : null;
    }
}
