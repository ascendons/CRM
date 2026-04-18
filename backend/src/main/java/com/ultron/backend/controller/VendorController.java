package com.ultron.backend.controller;

import com.ultron.backend.domain.enums.VendorStatus;
import com.ultron.backend.dto.request.CreateVendorRequest;
import com.ultron.backend.dto.request.UpdateVendorRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.VendorResponse;
import com.ultron.backend.service.VendorService;
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
@RequestMapping("/vendors")
@RequiredArgsConstructor
@Slf4j
public class VendorController {

    private final VendorService vendorService;

    @PostMapping
    @PreAuthorize("hasPermission('VENDORS', 'CREATE')")
    public ResponseEntity<ApiResponse<VendorResponse>> create(@Valid @RequestBody CreateVendorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Vendor created", vendorService.create(request, getCurrentUserId())));
    }

    @GetMapping
    @PreAuthorize("hasPermission('VENDORS', 'READ')")
    public ResponseEntity<ApiResponse<List<VendorResponse>>> getAll(
            @RequestParam(required = false) VendorStatus status,
            @RequestParam(required = false) String category) {
        List<VendorResponse> result;
        if (category != null) result = vendorService.getByCategory(category);
        else if (status != null) result = vendorService.getByStatus(status);
        else result = vendorService.getAll();
        return ResponseEntity.ok(ApiResponse.success("Vendors retrieved", result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('VENDORS', 'READ')")
    public ResponseEntity<ApiResponse<VendorResponse>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Vendor retrieved", vendorService.getById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('VENDORS', 'EDIT')")
    public ResponseEntity<ApiResponse<VendorResponse>> update(
            @PathVariable String id, @Valid @RequestBody UpdateVendorRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Vendor updated",
                vendorService.update(id, request, getCurrentUserId())));
    }

    @PostMapping("/{id}/rating")
    @PreAuthorize("hasPermission('VENDORS', 'EDIT')")
    public ResponseEntity<ApiResponse<VendorResponse>> updateRating(
            @PathVariable String id, @RequestBody Map<String, Integer> body) {
        return ResponseEntity.ok(ApiResponse.success("Vendor rating updated",
                vendorService.updateRating(id, body.get("rating"), getCurrentUserId())));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('VENDORS', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        vendorService.delete(id, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Vendor deleted", null));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : null;
    }
}
