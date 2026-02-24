package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.DynamicProduct;
import com.ultron.backend.dto.request.ProductSearchRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.DynamicProductResponse;
import com.ultron.backend.service.catalog.DynamicProductIngestionService;
import com.ultron.backend.service.catalog.DynamicProductSearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Dynamic Product Catalog API
 * Supports schema-less product uploads and searches
 */
@RestController
@RequestMapping("/catalog")
@RequiredArgsConstructor
@Slf4j
public class DynamicProductCatalogController {

    private final DynamicProductIngestionService ingestionService;
    private final DynamicProductSearchService searchService;

    /**
     * Preview headers from an uploaded file (no ingestion)
     * POST /api/v1/catalog/preview-headers
     */
    @PostMapping("/preview-headers")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> previewHeaders(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        String currentUserId = authentication.getName();
        log.info("User {} previewing headers for file: {}", currentUserId, file.getOriginalFilename());

        List<Map<String, String>> headers = ingestionService.previewHeaders(file);

        return ResponseEntity.ok(
                ApiResponse.<List<Map<String, String>>>builder()
                        .success(true)
                        .message("Headers preview successful")
                        .data(headers)
                        .build());
    }

    /**
     * Upload and ingest products from Excel/CSV
     * POST /api/v1/catalog/upload
     * @param searchableFields optional comma-separated list of normalized field keys that should be searchable
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<DynamicProductIngestionService.IngestionResult>> uploadProducts(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "searchableFields", required = false) List<String> searchableFields,
            Authentication authentication) {

        String currentUserId = authentication.getName();
        log.info("User {} uploading product catalog file: {}, searchableFields: {}", currentUserId, file.getOriginalFilename(), searchableFields);

        Set<String> searchableSet = (searchableFields != null && !searchableFields.isEmpty())
                ? new java.util.HashSet<>(searchableFields)
                : null; // null means all fields are searchable (backward compatible)

        DynamicProductIngestionService.IngestionResult result =
                ingestionService.ingestProducts(file, currentUserId, searchableSet);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.<DynamicProductIngestionService.IngestionResult>builder()
                        .success(true)
                        .message(String.format("Successfully imported %d products from %s",
                                result.getTotalProducts(), result.getFileName()))
                        .data(result)
                        .build());
    }

    /**
     * Search products with keyword and dynamic filters
     * POST /api/v1/catalog/search
     */
    @PostMapping("/search")
    public ResponseEntity<ApiResponse<Page<DynamicProductResponse>>> searchProducts(
            @RequestBody ProductSearchRequest request,
            Authentication authentication) {

        String currentUserId = authentication.getName();
        log.info("User {} searching products with keyword: {}", currentUserId, request.getKeyword());

        // Build search request
        DynamicProductSearchService.SearchRequest searchRequest =
                DynamicProductSearchService.SearchRequest.builder()
                        .keyword(request.getKeyword())
                        .category(request.getCategory())
                        .filters(convertFilters(request.getFilters()))
                        .build();

        // Create pageable
        Pageable pageable = PageRequest.of(
                request.getPage(),
                request.getSize(),
                Sort.Direction.fromString(request.getSortDirection()),
                request.getSortBy()
        );

        // Execute search
        Page<DynamicProduct> products = searchService.search(searchRequest, pageable);

        // Map to response
        Page<DynamicProductResponse> response = products.map(this::mapToResponse);

        return ResponseEntity.ok(
                ApiResponse.<Page<DynamicProductResponse>>builder()
                        .success(true)
                        .message("Search completed successfully")
                        .data(response)
                        .build());
    }

    /**
     * Get available filters dynamically
     * GET /api/v1/catalog/filters
     */
    @GetMapping("/filters")
    public ResponseEntity<ApiResponse<List<DynamicProductSearchService.AvailableFilter>>> getAvailableFilters(
            Authentication authentication) {

        String currentUserId = authentication.getName();
        log.info("User {} fetching available filters", currentUserId);

        List<DynamicProductSearchService.AvailableFilter> filters =
                searchService.getAvailableFilters();

        return ResponseEntity.ok(
                ApiResponse.<List<DynamicProductSearchService.AvailableFilter>>builder()
                        .success(true)
                        .message("Available filters retrieved successfully")
                        .data(filters)
                        .build());
    }

    /**
     * Get distinct values for a specific attribute
     * GET /api/v1/catalog/attributes/{key}/values
     */
    @GetMapping("/attributes/{key}/values")
    public ResponseEntity<ApiResponse<List<String>>> getAttributeValues(
            @PathVariable String key,
            Authentication authentication) {

        String currentUserId = authentication.getName();
        log.info("User {} fetching values for attribute: {}", currentUserId, key);

        List<String> values = searchService.getDistinctValues(key);

        return ResponseEntity.ok(
                ApiResponse.<List<String>>builder()
                        .success(true)
                        .message("Attribute values retrieved successfully")
                        .data(values)
                        .build());
    }

    /**
     * Get a single catalog product by ID
     * GET /api/v1/catalog/{id}
     * ADMIN ONLY
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DynamicProductResponse>> getProductById(
            @PathVariable String id,
            Authentication authentication) {

        String currentUserId = authentication.getName();
        log.info("User {} fetching catalog product: {}", currentUserId, id);

        DynamicProduct product = searchService.getById(id);
        DynamicProductResponse response = mapToResponse(product);

        return ResponseEntity.ok(
                ApiResponse.<DynamicProductResponse>builder()
                        .success(true)
                        .message("Product retrieved successfully")
                        .data(response)
                        .build());
    }

    /**
     * Update a catalog product
     * PUT /api/v1/catalog/{id}
     * ADMIN ONLY
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DynamicProductResponse>> updateProduct(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            Authentication authentication) {

        String currentUserId = authentication.getName();
        log.info("User {} updating catalog product: {}", currentUserId, id);

        String displayName = (String) body.get("displayName");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rawAttrs = (List<Map<String, Object>>) body.get("attributes");
        List<DynamicProduct.ProductAttribute> attributes = null;
        if (rawAttrs != null) {
            attributes = rawAttrs.stream().map(m -> DynamicProduct.ProductAttribute.builder()
                    .key((String) m.get("key"))
                    .originalKey((String) m.getOrDefault("originalKey", m.get("key")))
                    .value((String) m.get("value"))
                    .type(m.get("type") != null
                            ? DynamicProduct.AttributeType.valueOf((String) m.get("type"))
                            : DynamicProduct.AttributeType.STRING)
                    .numericValue(m.get("numericValue") != null ? ((Number) m.get("numericValue")).doubleValue() : null)
                    .unit((String) m.get("unit"))
                    .searchable(true)
                    .build()
            ).collect(Collectors.toList());
        }

        DynamicProduct updated = searchService.update(id, displayName, attributes);
        DynamicProductResponse response = mapToResponse(updated);

        return ResponseEntity.ok(
                ApiResponse.<DynamicProductResponse>builder()
                        .success(true)
                        .message("Product updated successfully")
                        .data(response)
                        .build());
    }

    /**
     * Delete a catalog product (soft or hard)
     * DELETE /api/v1/catalog/{id}?hard=true|false
     * ADMIN ONLY
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(
            @PathVariable String id,
            @RequestParam(defaultValue = "false") boolean hard,
            Authentication authentication) {

        String currentUserId = authentication.getName();
        log.info("User {} {}-deleting catalog product: {}", currentUserId, hard ? "hard" : "soft", id);

        if (hard) {
            searchService.hardDelete(id);
        } else {
            searchService.softDelete(id);
        }

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message(hard ? "Product permanently deleted" : "Product deleted successfully")
                        .build());
    }

    /**
     * Bulk delete catalog products (soft or hard)
     * POST /api/v1/catalog/bulk-delete
     * ADMIN ONLY
     */
    @PostMapping("/bulk-delete")
    @PreAuthorize("hasRole('ADMIN')")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<Map<String, Object>>> bulkDeleteProducts(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {

        String currentUserId = authentication.getName();
        List<String> ids = (List<String>) body.get("ids");
        boolean hard = Boolean.TRUE.equals(body.get("hard"));

        log.info("User {} bulk {}-deleting {} catalog products", currentUserId, hard ? "hard" : "soft", ids.size());

        int count;
        if (hard) {
            count = searchService.bulkHardDelete(ids);
        } else {
            count = searchService.bulkSoftDelete(ids);
        }

        return ResponseEntity.ok(
                ApiResponse.<Map<String, Object>>builder()
                        .success(true)
                        .message(String.format("%d products %s", count, hard ? "permanently deleted" : "deleted"))
                        .data(Map.of("deletedCount", count))
                        .build());
    }

    // Helper methods

    private Map<String, DynamicProductSearchService.FilterValue> convertFilters(
            Map<String, ProductSearchRequest.FilterRequest> filters) {

        if (filters == null) return null;

        return filters.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> DynamicProductSearchService.FilterValue.builder()
                                .type(DynamicProductSearchService.FilterType.valueOf(e.getValue().getType()))
                                .value(e.getValue().getValue())
                                .values(e.getValue().getValues())
                                .min(e.getValue().getMin())
                                .max(e.getValue().getMax())
                                .build()
                ));
    }

    private DynamicProductResponse mapToResponse(DynamicProduct product) {
        return DynamicProductResponse.builder()
                .id(product.getId())
                .productId(product.getProductId())
                .displayName(product.getDisplayName())
                .category(product.getCategory())
                .attributes(product.getAttributes().stream()
                        .map(attr -> DynamicProductResponse.AttributeResponse.builder()
                                .key(attr.getKey())
                                .displayKey(beautifyKey(attr.getKey()))
                                .value(attr.getValue())
                                .type(attr.getType())
                                .numericValue(attr.getNumericValue())
                                .unit(attr.getUnit())
                                .build())
                        .collect(Collectors.toList()))
                .sourceHeaders(product.getSource() != null ? product.getSource().getHeaders() : null)
                .createdAt(product.getCreatedAt())
                .createdBy(product.getCreatedBy())
                .build();
    }

    private String beautifyKey(String key) {
        return java.util.Arrays.stream(key.split("_"))
                .map(word -> word.substring(0, 1).toUpperCase() + word.substring(1))
                .collect(Collectors.joining(" "));
    }
}
