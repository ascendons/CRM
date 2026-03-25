package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.DynamicProduct;
import com.ultron.backend.domain.entity.Product;
import com.ultron.backend.domain.entity.ProductMapping;
import com.ultron.backend.dto.request.EnableInventoryRequest;
import com.ultron.backend.dto.request.LinkInventoryRequest;
import com.ultron.backend.dto.request.ProductSearchRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.DynamicProductResponse;
import com.ultron.backend.dto.response.InventoryStatusResponse;
import com.ultron.backend.service.ProductMappingService;
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

import jakarta.validation.Valid;

import java.math.BigDecimal;
import java.util.HashMap;
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
    private final ProductMappingService productMappingService;

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

        // Check if price was updated and sync to inventory
        if (attributes != null) {
            syncPriceToInventoryIfChanged(id, attributes);
        }

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

    /**
     * Get inventory status for a catalog product
     * GET /api/v1/catalog/{id}/inventory/status
     */
    @GetMapping("/{id}/inventory/status")
    public ResponseEntity<ApiResponse<InventoryStatusResponse>> getInventoryStatus(
            @PathVariable String id) {

        log.info("Getting inventory status for catalog product: {}", id);

        InventoryStatusResponse status = productMappingService.getInventoryStatus(id);

        return ResponseEntity.ok(ApiResponse.success("Inventory status retrieved successfully", status));
    }

    /**
     * Get inventory status for multiple catalog products (bulk)
     * POST /api/v1/catalog/inventory/status/bulk
     */
    @PostMapping("/inventory/status/bulk")
    public ResponseEntity<ApiResponse<Map<String, InventoryStatusResponse>>> getBulkInventoryStatus(
            @RequestBody List<String> productIds) {

        log.info("Getting bulk inventory status for {} products", productIds.size());

        Map<String, InventoryStatusResponse> statusMap = new HashMap<>();
        for (String productId : productIds) {
            try {
                InventoryStatusResponse status = productMappingService.getInventoryStatus(productId);
                statusMap.put(productId, status);
            } catch (Exception e) {
                log.warn("Failed to get status for product {}: {}", productId, e.getMessage());
                statusMap.put(productId, InventoryStatusResponse.notTracked());
            }
        }

        return ResponseEntity.ok(ApiResponse.success("Bulk inventory status retrieved successfully", statusMap));
    }

    /**
     * Link catalog product to existing structured product
     * POST /api/v1/catalog/{id}/inventory/link
     */
    @PostMapping("/{id}/inventory/link")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductMapping>> linkInventory(
            @PathVariable String id,
            @Valid @RequestBody LinkInventoryRequest request) {

        log.info("Linking catalog product {} to structured product {}", id, request.getStructuredProductId());

        ProductMapping mapping = productMappingService.linkProducts(id, request);

        return ResponseEntity.ok(ApiResponse.success("Inventory tracking linked successfully", mapping));
    }

    /**
     * Enable inventory tracking by creating new structured product
     * POST /api/v1/catalog/{id}/inventory/enable
     */
    @PostMapping("/{id}/inventory/enable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Product>> enableInventory(
            @PathVariable String id,
            @Valid @RequestBody EnableInventoryRequest request) {

        log.info("Enabling inventory tracking for catalog product: {}", id);

        Product product = productMappingService.enableInventory(id, request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Inventory tracking enabled successfully", product));
    }

    /**
     * Unlink catalog product from inventory
     * DELETE /api/v1/catalog/{id}/inventory
     */
    @DeleteMapping("/{id}/inventory")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> unlinkInventory(@PathVariable String id) {

        log.info("Unlinking inventory for catalog product: {}", id);

        productMappingService.unlinkInventory(id);

        return ResponseEntity.ok(ApiResponse.success("Inventory tracking disabled successfully", null));
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

    /**
     * Sync price from Catalog to Inventory when UnitPrice attribute is updated
     */
    private void syncPriceToInventoryIfChanged(String dynamicProductId, List<DynamicProduct.ProductAttribute> attributes) {
        try {
            // Look for price attribute in the updated attributes
            for (DynamicProduct.ProductAttribute attr : attributes) {
                String key = attr.getKey().toLowerCase();
                if (key.equalsIgnoreCase("UnitPrice")) {
                    try {
                        // Parse the price value
                        String value = attr.getValue();
                        String cleaned = value.replaceAll("[^0-9.]", "").trim();

                        if (!cleaned.isEmpty()) {
                            BigDecimal newPrice = new BigDecimal(cleaned);
                            log.info("Price attribute changed in catalog, syncing to inventory: {} -> {}",
                                    attr.getKey(), newPrice);

                            // Call ProductMappingService to sync
                            productMappingService.syncPriceToInventory(dynamicProductId, newPrice);
                        }
                    } catch (Exception e) {
                        log.warn("Failed to parse price value for sync: {}", attr.getValue());
                    }
                    break;
                }
            }
        } catch (Exception e) {
            log.error("Error syncing price to inventory: {}", e.getMessage());
            // Don't fail the update if sync fails
        }
    }
}
