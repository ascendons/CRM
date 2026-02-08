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
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
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
     * Upload and ingest products from Excel/CSV
     * POST /api/v1/catalog/upload
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<DynamicProductIngestionService.IngestionResult>> uploadProducts(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        String currentUserId = authentication.getName();
        log.info("User {} uploading product catalog file: {}", currentUserId, file.getOriginalFilename());

        DynamicProductIngestionService.IngestionResult result =
                ingestionService.ingestProducts(file, currentUserId);

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
