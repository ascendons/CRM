package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.RateContract;
import com.ultron.backend.dto.request.CreateRateContractRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.service.RateContractService;
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

@RestController
@RequestMapping("/procurement/rate-contracts")
@RequiredArgsConstructor
@Slf4j
public class RateContractController {

    private final RateContractService rateContractService;

    @PostMapping
    @PreAuthorize("hasPermission('PROCUREMENT', 'CREATE')")
    public ResponseEntity<ApiResponse<RateContract>> create(@Valid @RequestBody CreateRateContractRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Rate contract created",
                        rateContractService.create(request, getCurrentUserId())));
    }

    @GetMapping
    @PreAuthorize("hasPermission('PROCUREMENT', 'READ')")
    public ResponseEntity<ApiResponse<List<RateContract>>> getAll(
            @RequestParam(required = false) String vendorId,
            @RequestParam(required = false) Boolean activeOnly) {
        List<RateContract> result;
        if (vendorId != null) result = rateContractService.getByVendor(vendorId);
        else if (Boolean.TRUE.equals(activeOnly)) result = rateContractService.getActive();
        else result = rateContractService.getAll();
        return ResponseEntity.ok(ApiResponse.success("Rate contracts retrieved", result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('PROCUREMENT', 'READ')")
    public ResponseEntity<ApiResponse<RateContract>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Rate contract retrieved",
                rateContractService.getById(id)));
    }

    @PostMapping("/{id}/terminate")
    @PreAuthorize("hasPermission('PROCUREMENT', 'APPROVE')")
    public ResponseEntity<ApiResponse<RateContract>> terminate(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Rate contract terminated",
                rateContractService.terminate(id, getCurrentUserId())));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('PROCUREMENT', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        rateContractService.delete(id, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Rate contract deleted", null));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : null;
    }
}
