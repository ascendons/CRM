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
            String originalKeyword = searchRequest.getKeyword().trim();
            String normalizedKeyword = headerNormalizer.normalizeSearchQuery(originalKeyword);
            applyKeywordSearch(query, originalKeyword, normalizedKeyword);
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

        List<DynamicProduct> products;
        boolean hasKeywordSearch = searchRequest.getKeyword() != null && !searchRequest.getKeyword().trim().isEmpty();

        if (hasKeywordSearch) {
            // For keyword searches: fetch more results to rank properly
            // Fetch up to 200 results or all if less, then rank and paginate in memory
            int fetchSize = (int) Math.min(total, 200);
            query.limit(fetchSize);
            products = mongoTemplate.find(query, DynamicProduct.class);

            // --- BACKWARD COMPATIBILITY FIX ---
            // Ensure displayName forces 'ProductName' if it exists
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

            // Rank by relevance BEFORE pagination
            products = rankByRelevance(products, searchRequest.getKeyword());

            // Now apply manual pagination to ranked results
            int start = (int) pageable.getOffset();
            int end = Math.min(start + pageable.getPageSize(), products.size());
            if (start < products.size()) {
                products = products.subList(start, end);
            } else {
                products = new ArrayList<>();
            }
        } else {
            // For non-keyword searches: use standard pagination with sorting
            query.with(pageable);
            products = mongoTemplate.find(query, DynamicProduct.class);

            // --- BACKWARD COMPATIBILITY FIX ---
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
        }

        return new PageImpl<>(products, pageable, total);
    }

    /**
     * Apply keyword search using both original and normalized keywords
     * Original keyword: for exact/partial text matching
     * Normalized keyword: for semantic token matching
     */
    private void applyKeywordSearch(Query query, String originalKeyword, String normalizedKeyword) {
        // Tokenize normalized keyword for semantic matching
        List<String> tokens = headerNormalizer.createSearchTokens(normalizedKeyword);

        // Search in:
        // 1. Display name (use original keyword for exact matching)
        // 2. Search tokens (use original keyword)
        // 3. Normalized tokens (use normalized tokens)
        // 4. Attribute values (use original keyword for exact matching)

        List<Criteria> criteriaList = new ArrayList<>();

        // Display name contains original keyword (case insensitive)
        criteriaList.add(Criteria.where("displayName").regex(originalKeyword, "i"));

        // Search tokens contain original keyword
        criteriaList.add(Criteria.where("searchTokens").regex(originalKeyword, "i"));

        // Normalized tokens match (semantic search)
        if (!tokens.isEmpty()) {
            criteriaList.add(Criteria.where("normalizedTokens").in(tokens));
        }

        // Searchable attribute values contain original keyword
        criteriaList.add(Criteria.where("attributes").elemMatch(
                Criteria.where("value").regex(originalKeyword, "i")
                        .and("searchable").is(true)
        ));

        Criteria criteria = new Criteria().orOperator(criteriaList.toArray(new Criteria[0]));
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
     * Uses exclusive scoring - only the best match type contributes to avoid double-counting
     */
    private int calculateRelevanceScore(DynamicProduct product, String keyword) {
        int score = 0;
        String lowerDisplayName = product.getDisplayName() != null ? product.getDisplayName().toLowerCase() : "";

        // Display name matching (mutually exclusive - only best match counts)
        if (!lowerDisplayName.isEmpty()) {
            if (lowerDisplayName.equals(keyword)) {
                // Exact match - HIGHEST priority
                score += 1000;
            } else if (lowerDisplayName.startsWith(keyword)) {
                // Starts with keyword - HIGH priority
                score += 500;
            } else if (lowerDisplayName.contains(keyword)) {
                // Contains keyword - MEDIUM priority
                // Add bonus for shorter names (more relevant)
                int lengthBonus = Math.max(0, 100 - lowerDisplayName.length());
                score += 250 + lengthBonus;
            } else {
                // Fuzzy match - check if display name contains all characters of keyword in order
                if (containsInOrder(lowerDisplayName, keyword)) {
                    score += 100;
                }
            }
        }

        // Category exact match
        if (product.getCategory() != null) {
            String lowerCategory = product.getCategory().toLowerCase();
            if (lowerCategory.equals(keyword)) {
                score += 200;
            } else if (lowerCategory.contains(keyword)) {
                score += 50;
            }
        }

        // Count searchable attribute matches
        if (product.getAttributes() != null) {
            for (ProductAttribute attr : product.getAttributes()) {
                // Only count searchable attributes
                if (attr.isSearchable()) {
                    String lowerValue = attr.getValue().toLowerCase();
                    if (lowerValue.equals(keyword)) {
                        score += 150;
                    } else if (lowerValue.contains(keyword)) {
                        score += 25;
                    }

                    // Bonus for key match
                    if (attr.getKey().toLowerCase().contains(keyword)) {
                        score += 10;
                    }
                }
            }
        }

        return score;
    }

    /**
     * Check if target contains all characters of source in order (fuzzy match)
     */
    private boolean containsInOrder(String target, String source) {
        int sourceIndex = 0;
        for (int i = 0; i < target.length() && sourceIndex < source.length(); i++) {
            if (target.charAt(i) == source.charAt(sourceIndex)) {
                sourceIndex++;
            }
        }
        return sourceIndex == source.length();
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
