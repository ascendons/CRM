package com.ultron.backend.service;

import com.ultron.backend.domain.entity.*;
import com.ultron.backend.dto.request.CreateProductRequest;
import com.ultron.backend.dto.request.EnableInventoryRequest;
import com.ultron.backend.dto.request.LinkInventoryRequest;
import com.ultron.backend.dto.response.InventoryStatusResponse;
import com.ultron.backend.dto.response.ProductResponse;
import com.ultron.backend.exception.BadRequestException;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.*;
import com.ultron.backend.service.inventory.StockService;
import com.ultron.backend.service.inventory.WarehouseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service for managing Product Mapping between DynamicProduct and Product
 * Bridges catalog and inventory systems
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductMappingService extends BaseTenantService {

    private final ProductMappingRepository mappingRepository;
    private final DynamicProductRepository dynamicProductRepository;
    private final ProductRepository productRepository;
    private final StockRepository stockRepository;
    private final StockService stockService;
    private final WarehouseService warehouseService;
    private final ProductService productService;

    /**
     * Link an existing catalog product to an existing structured product
     */
    @Transactional
    public ProductMapping linkProducts(String dynamicProductId, LinkInventoryRequest request) {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();

        log.info("Linking catalog product {} to structured product {} for tenant {}",
            dynamicProductId, request.getStructuredProductId(), tenantId);

        // Verify dynamic product exists
        DynamicProduct dynamicProduct = dynamicProductRepository.findById(dynamicProductId)
            .orElseThrow(() -> new ResourceNotFoundException("Catalog product not found: " + dynamicProductId));

        if (!dynamicProduct.getTenantId().equals(tenantId)) {
            throw new BadRequestException("Catalog product does not belong to your organization");
        }

        // Verify structured product exists
        Product structuredProduct = productRepository.findById(request.getStructuredProductId())
            .orElseThrow(() -> new ResourceNotFoundException("Structured product not found: " + request.getStructuredProductId()));

        if (!structuredProduct.getTenantId().equals(tenantId)) {
            throw new BadRequestException("Product does not belong to your organization");
        }

        // Check if mapping already exists
        Optional<ProductMapping> existingMapping = mappingRepository
            .findByTenantIdAndDynamicProductId(tenantId, dynamicProductId);

        if (existingMapping.isPresent()) {
            throw new BadRequestException("Catalog product is already linked to inventory");
        }

        // Create mapping
        ProductMapping mapping = ProductMapping.builder()
            .tenantId(tenantId)
            .dynamicProductId(dynamicProductId)
            .structuredProductId(request.getStructuredProductId())
            .autoSyncEnabled(request.isAutoSyncEnabled())
            .inventoryTrackingEnabled(request.isInventoryTrackingEnabled())
            .attributeMapping(request.getAttributeMapping() != null ?
                request.getAttributeMapping() : createDefaultAttributeMapping())
            .syncStatus(ProductMapping.SyncStatus.NEVER_SYNCED)
            .createdAt(LocalDateTime.now())
            .createdBy(userId)
            .lastModifiedAt(LocalDateTime.now())
            .lastModifiedBy(userId)
            .build();

        mapping = mappingRepository.save(mapping);

        // Perform initial sync if auto-sync enabled
        if (request.isAutoSyncEnabled()) {
            try {
                syncProductToCatalog(mapping.getId());
            } catch (Exception e) {
                log.error("Initial sync failed for mapping {}: {}", mapping.getId(), e.getMessage());
                // Don't fail the linking, just log the error
            }
        }

        log.info("Successfully linked catalog product {} to structured product {}",
            dynamicProductId, request.getStructuredProductId());

        return mapping;
    }

    /**
     * Enable inventory tracking for a catalog product by creating a new structured product
     */
    @Transactional
    public Product enableInventory(String dynamicProductId, EnableInventoryRequest request) {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();

        log.info("Enabling inventory for catalog product {} for tenant {}", dynamicProductId, tenantId);

        // Verify dynamic product exists
        DynamicProduct dynamicProduct = dynamicProductRepository.findById(dynamicProductId)
            .orElseThrow(() -> new ResourceNotFoundException("Catalog product not found: " + dynamicProductId));

        if (!dynamicProduct.getTenantId().equals(tenantId)) {
            throw new BadRequestException("Catalog product does not belong to your organization");
        }

        // Check if already linked
        if (mappingRepository.existsByTenantIdAndDynamicProductId(tenantId, dynamicProductId)) {
            throw new BadRequestException("Catalog product already has inventory tracking enabled");
        }

        // Verify warehouse exists
        Warehouse warehouse = warehouseService.getWarehouseById(request.getWarehouseId());

        // Extract data from DynamicProduct
        Map<String, String> extractedData = extractDataFromDynamicProduct(dynamicProduct);

        // Create structured product using DTO
        CreateProductRequest productRequest = CreateProductRequest.builder()
            .sku(request.getSku())
            .productName(dynamicProduct.getDisplayName())
            .description(extractedData.get("description"))
            .hsnCode(extractedData.get("hsnCode"))
            .basePrice(request.getBasePrice() != null ? request.getBasePrice() :
                parsePrice(extractedData.get("unitPrice")))
            .listPrice(request.getListPrice())
            .currency(request.getCurrency())
            .unit(extractedData.get("unit"))
            .taxRate(request.getTaxRate())
            .taxType(request.getTaxType())
            .category(dynamicProduct.getCategory())
            .minStockLevel(request.getMinStockLevel())
            .maxStockLevel(request.getMaxStockLevel())
            .reorderLevel(request.getReorderLevel())
            .build();

        ProductResponse productResponse = productService.createProduct(productRequest, userId);

        // Get the created product MongoDB _id (NOT the business productId!)
        String productId = productResponse.getId();

        log.info("Created structured product {} (MongoDB _id) for catalog product {}", productId, dynamicProductId);

        // Create initial stock entry if initialStock > 0
        if (request.getInitialStock() != null && request.getInitialStock() > 0) {
            try {
                Stock stock = Stock.builder()
                    .tenantId(tenantId)
                    .productId(productId)
                    .warehouseId(request.getWarehouseId())
                    .quantityOnHand(request.getInitialStock())
                    .quantityAvailable(request.getInitialStock())
                    .quantityReserved(0)
                    .unitCost(request.getBasePrice() != null ? request.getBasePrice() : BigDecimal.ZERO)
                    .totalValue((request.getBasePrice() != null ? request.getBasePrice() : BigDecimal.ZERO)
                        .multiply(BigDecimal.valueOf(request.getInitialStock())))
                    .lastRestockedAt(LocalDateTime.now())
                    .lastMovementAt(LocalDateTime.now())
                    .createdAt(LocalDateTime.now())
                    .createdBy(userId)
                    .build();

                stockRepository.save(stock);

                log.info("Created initial stock entry: {} units in warehouse {}",
                    request.getInitialStock(), request.getWarehouseId());
            } catch (Exception e) {
                log.error("Failed to create initial stock entry: {}", e.getMessage());
                // Don't fail the entire operation
            }
        }

        // Create product mapping
        ProductMapping mapping = ProductMapping.builder()
            .tenantId(tenantId)
            .dynamicProductId(dynamicProductId)
            .structuredProductId(productId)
            .autoSyncEnabled(request.isAutoSyncEnabled())
            .inventoryTrackingEnabled(true)
            .attributeMapping(request.getAttributeMapping() != null ?
                request.getAttributeMapping() : createDefaultAttributeMapping())
            .syncStatus(ProductMapping.SyncStatus.IN_SYNC)
            .lastSyncedAt(LocalDateTime.now())
            .createdAt(LocalDateTime.now())
            .createdBy(userId)
            .lastModifiedAt(LocalDateTime.now())
            .lastModifiedBy(userId)
            .build();

        mappingRepository.save(mapping);

        log.info("Successfully enabled inventory tracking for catalog product {}", dynamicProductId);

        // Return the created product entity
        return productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Created product not found: " + productId));
    }

    /**
     * Get inventory status for a catalog product
     */
    public InventoryStatusResponse getInventoryStatus(String dynamicProductId) {
        String tenantId = getCurrentTenantId();

        // Find mapping
        Optional<ProductMapping> mappingOpt = mappingRepository
            .findByTenantIdAndDynamicProductId(tenantId, dynamicProductId);

        if (mappingOpt.isEmpty() || !mappingOpt.get().isInventoryTrackingEnabled()) {
            return InventoryStatusResponse.notTracked();
        }

        ProductMapping mapping = mappingOpt.get();

        // Get structured product
        Product product = productRepository.findById(mapping.getStructuredProductId())
            .orElse(null);

        if (product == null) {
            log.warn("Mapping exists but structured product not found: {}", mapping.getStructuredProductId());
            return InventoryStatusResponse.notTracked();
        }

        // Get stock information
        List<Stock> stocks = stockRepository.findByTenantIdAndProductId(tenantId, product.getId());

        // Aggregate stock across all warehouses
        int totalOnHand = stocks.stream().mapToInt(Stock::getQuantityOnHand).sum();
        int totalReserved = stocks.stream().mapToInt(Stock::getQuantityReserved).sum();
        int totalAvailable = stocks.stream().mapToInt(Stock::getQuantityAvailable).sum();

        // Get primary warehouse (first one or default)
        Stock primaryStock = stocks.isEmpty() ? null : stocks.get(0);
        Warehouse warehouse = null;
        if (primaryStock != null) {
            try {
                warehouse = warehouseService.getWarehouseById(primaryStock.getWarehouseId());
            } catch (Exception e) {
                log.warn("Failed to get warehouse: {}", e.getMessage());
            }
        }

        // Build response
        return InventoryStatusResponse.builder()
            .inventoryTracked(true)
            .structuredProductId(product.getId())
            .sku(product.getSku())
            .onHandStock(totalOnHand)
            .reservedStock(totalReserved)
            .availableStock(totalAvailable)
            .minStockLevel(product.getMinStockLevel())
            .reorderLevel(product.getReorderLevel())
            .isLowStock(product.getReorderLevel() != null && totalAvailable <= product.getReorderLevel())
            .isOutOfStock(totalAvailable == 0)
            .needsReorder(product.getReorderLevel() != null && totalAvailable <= product.getReorderLevel())
            .warehouseId(primaryStock != null ? primaryStock.getWarehouseId() : null)
            .warehouseName(warehouse != null ? warehouse.getName() : null)
            .basePrice(product.getBasePrice())
            .listPrice(product.getListPrice())
            .currency(product.getCurrency())
            .syncStatus(mapping.getSyncStatus().toString())
            .lastSyncedAt(mapping.getLastSyncedAt() != null ?
                mapping.getLastSyncedAt().toString() : null)
            .build();
    }

    /**
     * Unlink catalog product from inventory
     */
    @Transactional
    public void unlinkInventory(String dynamicProductId) {
        String tenantId = getCurrentTenantId();

        log.info("Unlinking inventory for catalog product {} in tenant {}", dynamicProductId, tenantId);

        mappingRepository.deleteByTenantIdAndDynamicProductId(tenantId, dynamicProductId);

        log.info("Successfully unlinked catalog product {}", dynamicProductId);
    }

    /**
     * Sync data from Product to DynamicProduct
     */
    @Transactional
    public void syncProductToCatalog(String mappingId) {
        ProductMapping mapping = mappingRepository.findById(mappingId)
            .orElseThrow(() -> new ResourceNotFoundException("Product mapping not found"));

        if (!mapping.isAutoSyncEnabled()) {
            log.debug("Auto-sync is disabled for mapping {}", mappingId);
            return;
        }

        log.info("Syncing structured product to catalog for mapping {}", mappingId);

        try {
            // Get both products
            Product product = productRepository.findById(mapping.getStructuredProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Structured product not found"));

            DynamicProduct dynamicProduct = dynamicProductRepository.findById(mapping.getDynamicProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Catalog product not found"));

            // Update dynamic product attributes based on mapping
            // This is a simplified version - you can enhance based on attributeMapping
            boolean updated = false;

            // Update display name if changed
            if (!product.getProductName().equals(dynamicProduct.getDisplayName())) {
                dynamicProduct.setDisplayName(product.getProductName());
                updated = true;
            }

            if (updated) {
                dynamicProduct.setLastModifiedAt(LocalDateTime.now());
                dynamicProductRepository.save(dynamicProduct);
            }

            // Update mapping status
            mapping.setSyncStatus(ProductMapping.SyncStatus.IN_SYNC);
            mapping.setLastSyncedAt(LocalDateTime.now());
            mapping.setLastSyncError(null);
            mappingRepository.save(mapping);

            log.info("Successfully synced mapping {}", mappingId);

        } catch (Exception e) {
            log.error("Sync failed for mapping {}: {}", mappingId, e.getMessage(), e);

            // Update mapping status
            mapping.setSyncStatus(ProductMapping.SyncStatus.SYNC_FAILED);
            mapping.setLastSyncError(e.getMessage());
            mappingRepository.save(mapping);

            throw e;
        }
    }

    /**
     * Create default attribute mapping
     */
    private Map<String, String> createDefaultAttributeMapping() {
        Map<String, String> mapping = new HashMap<>();
        mapping.put("ProductName", "productName");
        mapping.put("UnitPrice", "basePrice");
        mapping.put("Unit", "unit");
        mapping.put("Description", "description");
        mapping.put("HsnCode", "hsnCode");
        return mapping;
    }

    /**
     * Extract data from DynamicProduct attributes
     */
    private Map<String, String> extractDataFromDynamicProduct(DynamicProduct dynamicProduct) {
        Map<String, String> data = new HashMap<>();

        if (dynamicProduct.getAttributes() != null) {
            for (DynamicProduct.ProductAttribute attr : dynamicProduct.getAttributes()) {
                String key = attr.getKey().toLowerCase();
                String value = attr.getValue();

                if (key.contains("unit") && !key.contains("price")) {
                    data.put("unit", value);
                } else if (key.contains("description") || key.contains("desc")) {
                    data.put("description", value);
                } else if (key.contains("hsn")) {
                    data.put("hsnCode", value);
                } else if (key.contains("price")) {
                    data.put("unitPrice", value);
                }
            }
        }

        return data;
    }

    /**
     * Parse price from string
     */
    private BigDecimal parsePrice(String priceStr) {
        if (priceStr == null || priceStr.trim().isEmpty()) {
            return BigDecimal.ZERO;
        }

        try {
            // Remove currency symbols and commas
            String cleaned = priceStr.replaceAll("[^0-9.]", "");
            return new BigDecimal(cleaned);
        } catch (Exception e) {
            log.warn("Failed to parse price: {}", priceStr);
            return BigDecimal.ZERO;
        }
    }
}
