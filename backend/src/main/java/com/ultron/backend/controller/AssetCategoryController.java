package com.ultron.backend.controller;

import com.ultron.backend.dto.request.CreateAssetCategoryRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.AssetCategoryResponse;
import com.ultron.backend.service.AssetCategoryService;
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
@RequestMapping("/asset-categories")
@RequiredArgsConstructor
@Slf4j
public class AssetCategoryController {

    private final AssetCategoryService categoryService;

    @PostMapping
    @PreAuthorize("hasPermission('ASSETS', 'CREATE')")
    public ResponseEntity<ApiResponse<AssetCategoryResponse>> create(
            @Valid @RequestBody CreateAssetCategoryRequest request) {
        AssetCategoryResponse response = categoryService.create(request, getCurrentUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Asset category created", response));
    }

    @GetMapping
    @PreAuthorize("hasPermission('ASSETS', 'READ')")
    public ResponseEntity<ApiResponse<List<AssetCategoryResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success("Asset categories retrieved", categoryService.getAll()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('ASSETS', 'READ')")
    public ResponseEntity<ApiResponse<AssetCategoryResponse>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Asset category retrieved", categoryService.getById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('ASSETS', 'EDIT')")
    public ResponseEntity<ApiResponse<AssetCategoryResponse>> update(
            @PathVariable String id,
            @Valid @RequestBody CreateAssetCategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Asset category updated",
                categoryService.update(id, request, getCurrentUserId())));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('ASSETS', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        categoryService.delete(id, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Asset category deleted", null));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : null;
    }
}
