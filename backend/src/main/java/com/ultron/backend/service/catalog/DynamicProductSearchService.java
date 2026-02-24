package com.ultron.backend.service.catalog;

import com.ultron.backend.domain.entity.DynamicProduct;
import com.ultron.backend.domain.entity.DynamicProduct.ProductAttribute;
import com.ultron.backend.repository.DynamicProductRepository;
import com.ultron.backend.service.BaseTenantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Dynamic search service with keyword search, filters, and relevance ranking
 * Key principle: ALL search logic is metadata-driven, NO hardcoding
 * MULTI-TENANT AWARE: All operations are scoped to current tenant
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DynamicProductSearchService extends BaseTenantService {

    private final DynamicProductRepository repository;
    private final MongoTemplate mongoTemplate;
    private final HeaderNormalizer headerNormalizer;

    /**
     * Search products with keyword and dynamic filters
     * MULTI-TENANT SAFE
     */
    public Page<DynamicProduct> search(SearchRequest searchRequest, Pageable pageable) {
        String tenantId = getCurrentTenantId();

        Query query = new Query();
        query.addCriteria(Criteria.where("tenantId").is(tenantId));
        query.addCriteria(Criteria.where("isDeleted").is(false));

        // Apply keyword search
        if (searchRequest.getKeyword() != null && !searchRequest.getKeyword().trim().isEmpty()) {
            String normalizedKeyword = headerNormalizer.normalizeSearchQuery(searchRequest.getKeyword());
            applyKeywordSearch(query, normalizedKeyword);
        }

        // Apply category filter
        if (searchRequest.getCategory() != null && !searchRequest.getCategory().trim().isEmpty()) {
            query.addCriteria(Criteria.where("category").is(searchRequest.getCategory()));
        }

        // Apply dynamic attribute filters
        if (searchRequest.getFilters() != null && !searchRequest.getFilters().isEmpty()) {
            applyDynamicFilters(query, searchRequest.getFilters());
        }

        // Count total
        long total = mongoTemplate.count(query, DynamicProduct.class);

        // Apply pagination
        query.with(pageable);

        // Execute search
        List<DynamicProduct> products = mongoTemplate.find(query, DynamicProduct.class);

        // --- BACKWARD COMPATIBILITY FIX ---
        // Ensure displayName forces 'ProductName' if it exists. 
        // Solves issues with previously uploaded catalogs mapping IDs or Descriptions instead.
        products.forEach(p -> {
            if (p.getAttributes() != null) {
                for (ProductAttribute attr : p.getAttributes()) {
                    String key = attr.getKey().toLowerCase();
                    if (key.equals("productname") || key.equals("product_name") || key.equals("itemname") || key.equals("item_name") || key.equals("name")) {
                        p.setDisplayName(attr.getValue());
                        break;
                    }
                }
            }
        });

        // Rank by relevance if keyword search
        if (searchRequest.getKeyword() != null && !searchRequest.getKeyword().trim().isEmpty()) {
            products = rankByRelevance(products, searchRequest.getKeyword());
        }

        return new PageImpl<>(products, pageable, total);
    }

    /**
     * Apply keyword search using normalized tokens
     */
    private void applyKeywordSearch(Query query, String keyword) {
        // Tokenize keyword
        List<String> tokens = headerNormalizer.createSearchTokens(keyword);

        if (tokens.isEmpty()) {
            return;
        }

        // Search in:
        // 1. Display name (highest priority)
        // 2. Search tokens
        // 3. Normalized tokens
        // 4. Attribute values

        Criteria criteria = new Criteria().orOperator(
                // Display name contains keyword
                Criteria.where("displayName").regex(keyword, "i"),

                // Search tokens contain keyword
                Criteria.where("searchTokens").regex(keyword, "i"),

                // Normalized tokens match
                Criteria.where("normalizedTokens").in(tokens),

                // Only searchable attribute values
                Criteria.where("attributes").elemMatch(
                        Criteria.where("value").regex(keyword, "i")
                                .and("searchable").is(true)
                )
        );

        query.addCriteria(criteria);
    }

    /**
     * Apply dynamic attribute filters
     */
    private void applyDynamicFilters(Query query, Map<String, FilterValue> filters) {
        for (Map.Entry<String, FilterValue> entry : filters.entrySet()) {
            String attributeKey = entry.getKey();
            FilterValue filterValue = entry.getValue();

            Criteria filterCriteria = createFilterCriteria(attributeKey, filterValue);
            if (filterCriteria != null) {
                query.addCriteria(filterCriteria);
            }
        }
    }

    /**
     * Create filter criteria based on filter type
     */
    private Criteria createFilterCriteria(String attributeKey, FilterValue filterValue) {
        switch (filterValue.getType()) {
            case EXACT:
                // Exact match on attribute value
                return Criteria.where("attributes").elemMatch(
                        Criteria.where("key").is(attributeKey)
                                .and("value").is(filterValue.getValue())
                );

            case RANGE:
                // Numeric range filter
                Criteria rangeCriteria = Criteria.where("attributes").elemMatch(
                        Criteria.where("key").is(attributeKey)
                                .and("numericValue").gte(filterValue.getMin())
                                .lte(filterValue.getMax())
                );
                return rangeCriteria;

            case IN:
                // Multiple values (OR)
                return Criteria.where("attributes").elemMatch(
                        Criteria.where("key").is(attributeKey)
                                .and("value").in(filterValue.getValues())
                );

            case CONTAINS:
                // Partial match
                return Criteria.where("attributes").elemMatch(
                        Criteria.where("key").is(attributeKey)
                                .and("value").regex(filterValue.getValue(), "i")
                );

            default:
                return null;
        }
    }

    /**
     * Rank products by relevance to search keyword
     */
    private List<DynamicProduct> rankByRelevance(List<DynamicProduct> products, String keyword) {
        String lowerKeyword = keyword.toLowerCase();

        return products.stream()
                .sorted((p1, p2) -> {
                    int score1 = calculateRelevanceScore(p1, lowerKeyword);
                    int score2 = calculateRelevanceScore(p2, lowerKeyword);
                    return Integer.compare(score2, score1); // Descending
                })
                .collect(Collectors.toList());
    }

    /**
     * Calculate relevance score for a product
     */
    private int calculateRelevanceScore(DynamicProduct product, String keyword) {
        int score = 0;

        // Exact match in display name (highest weight)
        if (product.getDisplayName() != null &&
                product.getDisplayName().toLowerCase().equals(keyword)) {
            score += 100;
        }

        // Display name contains keyword (high weight)
        if (product.getDisplayName() != null &&
                product.getDisplayName().toLowerCase().contains(keyword)) {
            score += 50;
        }

        // Display name starts with keyword
        if (product.getDisplayName() != null &&
                product.getDisplayName().toLowerCase().startsWith(keyword)) {
            score += 30;
        }

        // Category matches keyword
        if (product.getCategory() != null &&
                product.getCategory().toLowerCase().contains(keyword)) {
            score += 20;
        }

        // Count attribute matches
        if (product.getAttributes() != null) {
            for (ProductAttribute attr : product.getAttributes()) {
                if (attr.getValue().toLowerCase().contains(keyword)) {
                    score += 10;
                }
                if (attr.getKey().toLowerCase().contains(keyword)) {
                    score += 5;
                }
            }
        }

        return score;
    }

    /**
     * Get a single product by ID
     * MULTI-TENANT SAFE
     */
    public DynamicProduct getById(String id) {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Getting dynamic product by id: {}", tenantId, id);

        return repository.findByIdAndTenantId(id, tenantId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new RuntimeException("Product not found: " + id));
    }

    /**
     * Update a dynamic product's displayName and attributes
     * MULTI-TENANT SAFE
     */
    public DynamicProduct update(String id, String displayName, List<ProductAttribute> attributes) {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Updating dynamic product: {}", tenantId, id);

        DynamicProduct product = repository.findByIdAndTenantId(id, tenantId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new RuntimeException("Product not found: " + id));

        if (displayName != null && !displayName.isBlank()) {
            product.setDisplayName(displayName);
        }
        if (attributes != null) {
            product.setAttributes(attributes);
            // Rebuild search tokens from new attributes
            StringBuilder sb = new StringBuilder();
            if (product.getDisplayName() != null) sb.append(product.getDisplayName()).append(" ");
            for (ProductAttribute attr : attributes) {
                sb.append(attr.getValue()).append(" ");
            }
            product.setSearchTokens(sb.toString().trim());
        }

        product.setLastModifiedAt(java.time.LocalDateTime.now());
        return repository.save(product);
    }

    /**
     * Soft-delete a dynamic product (set isDeleted = true)
     * MULTI-TENANT SAFE
     */
    public void softDelete(String id) {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Soft-deleting dynamic product: {}", tenantId, id);

        DynamicProduct product = repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new RuntimeException("Product not found: " + id));

        product.setDeleted(true);
        product.setDeletedAt(java.time.LocalDateTime.now());
        repository.save(product);
    }

    /**
     * Hard-delete a dynamic product (permanently remove from DB)
     * MULTI-TENANT SAFE
     */
    public void hardDelete(String id) {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Hard-deleting dynamic product: {}", tenantId, id);

        DynamicProduct product = repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new RuntimeException("Product not found: " + id));

        repository.delete(product);
    }

    /**
     * Bulk soft-delete dynamic products
     * MULTI-TENANT SAFE
     */
    public int bulkSoftDelete(List<String> ids) {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Bulk soft-deleting {} products", tenantId, ids.size());

        int count = 0;
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        for (String id : ids) {
            repository.findByIdAndTenantId(id, tenantId).ifPresent(product -> {
                product.setDeleted(true);
                product.setDeletedAt(now);
                repository.save(product);
            });
            count++;
        }
        return count;
    }

    /**
     * Bulk hard-delete dynamic products
     * MULTI-TENANT SAFE
     */
    public int bulkHardDelete(List<String> ids) {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Bulk hard-deleting {} products", tenantId, ids.size());

        int count = 0;
        for (String id : ids) {
            repository.findByIdAndTenantId(id, tenantId).ifPresent(product -> {
                repository.delete(product);
            });
            count++;
        }
        return count;
    }

    /**
     * Get available filters dynamically from data
     * MULTI-TENANT SAFE
     */
    public List<AvailableFilter> getAvailableFilters() {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Getting available filters", tenantId);

        List<DynamicProduct> allProducts = repository.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(
                tenantId, Pageable.unpaged()).getContent();

        if (allProducts.isEmpty()) {
            return Collections.emptyList();
        }

        // Collect all unique attribute keys
        Map<String, Set<String>> attributeValuesMap = new HashMap<>();
        Map<String, DynamicProduct.AttributeType> attributeTypesMap = new HashMap<>();

        for (DynamicProduct product : allProducts) {
            if (product.getAttributes() == null) continue;

            for (ProductAttribute attr : product.getAttributes()) {
                String key = attr.getKey();

                attributeValuesMap.computeIfAbsent(key, k -> new HashSet<>())
                        .add(attr.getValue());

                attributeTypesMap.putIfAbsent(key, attr.getType());
            }
        }

        // Build available filters
        List<AvailableFilter> filters = new ArrayList<>();
        for (Map.Entry<String, Set<String>> entry : attributeValuesMap.entrySet()) {
            String key = entry.getKey();
            Set<String> values = entry.getValue();
            DynamicProduct.AttributeType type = attributeTypesMap.get(key);

            AvailableFilter filter = AvailableFilter.builder()
                    .attributeKey(key)
                    .displayName(beautifyKey(key))
                    .type(type)
                    .availableValues(new ArrayList<>(values))
                    .build();

            filters.add(filter);
        }

        return filters;
    }

    /**
     * Get distinct values for a specific attribute
     * MULTI-TENANT SAFE
     */
    public List<String> getDistinctValues(String attributeKey) {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Getting distinct values for attribute: {}", tenantId, attributeKey);

        List<DynamicProduct> products = repository.findByAttributeKeyAndTenantId(attributeKey, tenantId);

        Set<String> values = new HashSet<>();
        for (DynamicProduct product : products) {
            if (product.getAttributes() == null) continue;

            for (ProductAttribute attr : product.getAttributes()) {
                if (attr.getKey().equals(attributeKey)) {
                    values.add(attr.getValue());
                }
            }
        }

        return new ArrayList<>(values);
    }

    /**
     * Beautify attribute key for display
     */
    private String beautifyKey(String key) {
        return Arrays.stream(key.split("_"))
                .map(word -> word.substring(0, 1).toUpperCase() + word.substring(1))
                .collect(Collectors.joining(" "));
    }

    /**
     * Search request
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class SearchRequest {
        private String keyword;
        private String category;
        private Map<String, FilterValue> filters;
    }

    /**
     * Filter value
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class FilterValue {
        private FilterType type;
        private String value;
        private List<String> values;
        private Double min;
        private Double max;
    }

    /**
     * Filter type
     */
    public enum FilterType {
        EXACT,      // Exact match
        RANGE,      // Numeric range
        IN,         // Multiple values
        CONTAINS    // Partial match
    }

    /**
     * Available filter
     */
    @lombok.Data
    @lombok.Builder
    public static class AvailableFilter {
        private String attributeKey;
        private String displayName;
        private DynamicProduct.AttributeType type;
        private List<String> availableValues;
    }
}
