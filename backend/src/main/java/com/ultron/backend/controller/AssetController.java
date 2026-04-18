package com.ultron.backend.controller;

import com.ultron.backend.domain.enums.AssetStatus;
import com.ultron.backend.dto.request.CreateAssetRequest;
import com.ultron.backend.dto.request.UpdateAssetRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.AssetResponse;
import com.ultron.backend.service.AssetService;
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
@RequestMapping("/assets")
@RequiredArgsConstructor
@Slf4j
public class AssetController {

    private final AssetService assetService;

    @PostMapping
    @PreAuthorize("hasPermission('ASSETS', 'CREATE')")
    public ResponseEntity<ApiResponse<AssetResponse>> create(
            @Valid @RequestBody CreateAssetRequest request) {
        AssetResponse response = assetService.create(request, getCurrentUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Asset created successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasPermission('ASSETS', 'READ')")
    public ResponseEntity<ApiResponse<List<AssetResponse>>> getAll(
            @RequestParam(required = false) String accountId,
            @RequestParam(required = false) AssetStatus status,
            @RequestParam(required = false) Integer warrantyExpiringSoonDays) {

        List<AssetResponse> assets;
        if (accountId != null) {
            assets = assetService.getByAccount(accountId);
        } else if (status != null) {
            assets = assetService.getByStatus(status);
        } else if (warrantyExpiringSoonDays != null) {
            assets = assetService.getWarrantyExpiringSoon(warrantyExpiringSoonDays);
        } else {
            assets = assetService.getAll();
        }
        return ResponseEntity.ok(ApiResponse.success("Assets retrieved successfully", assets));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('ASSETS', 'READ')")
    public ResponseEntity<ApiResponse<AssetResponse>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Asset retrieved", assetService.getById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('ASSETS', 'EDIT')")
    public ResponseEntity<ApiResponse<AssetResponse>> update(
            @PathVariable String id,
            @Valid @RequestBody UpdateAssetRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Asset updated",
                assetService.update(id, request, getCurrentUserId())));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('ASSETS', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        assetService.delete(id, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Asset deleted", null));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : null;
    }
}
