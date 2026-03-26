package com.ultron.backend.service.inventory;

import com.ultron.backend.domain.entity.DynamicProduct;
import com.ultron.backend.domain.entity.ProductMapping;
import com.ultron.backend.domain.entity.Stock;
import com.ultron.backend.domain.entity.StockTransaction;
import com.ultron.backend.domain.entity.Warehouse;
import com.ultron.backend.exception.BadRequestException;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.DynamicProductRepository;
import com.ultron.backend.repository.ProductRepository;
import com.ultron.backend.repository.ProductMappingRepository;
import com.ultron.backend.repository.StockRepository;
import com.ultron.backend.repository.StockTransactionRepository;
import com.ultron.backend.service.BaseTenantService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for stock management operations
 */
@Slf4j
@Service
public class StockService extends BaseTenantService {

    private final StockRepository stockRepository;
    private final StockTransactionRepository transactionRepository;
    private final DynamicProductRepository dynamicProductRepository;
    private final ProductRepository structuredProductRepository;
    private final WarehouseService warehouseService;
    private final TransactionIdGeneratorService transactionIdGenerator;
    private final ProductMappingRepository productMappingRepository;

    public StockService(
        StockRepository stockRepository,
        StockTransactionRepository transactionRepository,
        DynamicProductRepository dynamicProductRepository,
        ProductRepository structuredProductRepository,
        WarehouseService warehouseService,
        TransactionIdGeneratorService transactionIdGenerator,
        ProductMappingRepository productMappingRepository
    ) {
        this.stockRepository = stockRepository;
        this.transactionRepository = transactionRepository;
        this.dynamicProductRepository = dynamicProductRepository;
        this.structuredProductRepository = structuredProductRepository;
        this.warehouseService = warehouseService;
        this.transactionIdGenerator = transactionIdGenerator;
        this.productMappingRepository = productMappingRepository;
    }

    /**
     * Get or create stock record
     */
    @Transactional
    public Stock getOrCreateStock(String productId, String warehouseId) {
        String tenantId = getCurrentTenantId();

        // Validate structured product exists (Stock.productId stores Product MongoDB _id)
        structuredProductRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));

        // Validate warehouse exists
        warehouseService.getWarehouseById(warehouseId);

        return stockRepository.findByTenantIdAndProductIdAndWarehouseId(tenantId, productId, warehouseId)
            .orElseGet(() -> createInitialStock(productId, warehouseId));
    }

    /**
     * Create initial stock record with zero quantities
     */
    private Stock createInitialStock(String productId, String warehouseId) {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();
        

        Stock stock = Stock.builder()
            .tenantId(tenantId)
            .productId(productId)
            .warehouseId(warehouseId)
            .quantityOnHand(0)
            .quantityReserved(0)
            .quantityAvailable(0)
            .quantityOnOrder(0)
            .quantityDamaged(0)
            .costingMethod("WEIGHTED_AVG")
            .unitCost(BigDecimal.ZERO)
            .totalValue(BigDecimal.ZERO)
            .createdAt(LocalDateTime.now())
            .createdBy(userId)
            .build();

        log.info("Creating initial stock for product: {} at warehouse: {}", productId, warehouseId);
        return stockRepository.save(stock);
    }

    /**
     * Adjust stock (increase or decrease)
     */
    @Transactional
    public StockTransaction adjustStock(
        String productId,
        String warehouseId,
        Integer quantity,
        StockTransaction.Direction direction,
        String reason,
        BigDecimal unitCost,
        String referenceType,
        String referenceId
    ) {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();
        

        if (quantity == null || quantity <= 0) {
            throw new BadRequestException("Quantity must be greater than zero");
        }

        // Get or create stock
        Stock stock = getOrCreateStock(productId, warehouseId);

        // Calculate new quantities
        int quantityBefore = stock.getQuantityOnHand();
        int quantityAfter;

        if (direction == StockTransaction.Direction.IN) {
            quantityAfter = quantityBefore + quantity;
        } else {
            quantityAfter = quantityBefore - quantity;
            if (quantityAfter < 0) {
                throw new BadRequestException(
                    "Insufficient stock. Available: " + quantityBefore + ", Requested: " + quantity
                );
            }
        }

        // Update stock
        stock.setQuantityOnHand(quantityAfter);
        stock.setQuantityAvailable(quantityAfter - stock.getQuantityReserved());

        // Update costing if provided and direction is IN
        if (unitCost != null && direction == StockTransaction.Direction.IN) {
            updateCost(stock, quantity, unitCost);
        }

        stock.setLastMovementAt(LocalDateTime.now());
        stock.setUpdatedAt(LocalDateTime.now());
        stock.setUpdatedBy(userId);

        if (direction == StockTransaction.Direction.IN) {
            stock.setLastRestockedAt(LocalDateTime.now());
        }

        stockRepository.save(stock);

        // Sync price to catalog if unitCost was updated
        if (unitCost != null && direction == StockTransaction.Direction.IN) {
            syncPriceToCatalogAsync(productId, stock.getUnitCost());
        }

        // Create transaction record
        StockTransaction.TransactionType transactionType =
            direction == StockTransaction.Direction.IN
                ? StockTransaction.TransactionType.ADJUSTMENT_IN
                : StockTransaction.TransactionType.ADJUSTMENT_OUT;

        StockTransaction transaction = StockTransaction.builder()
            .transactionId(transactionIdGenerator.generateTransactionId())
            .tenantId(tenantId)
            .productId(productId)
            .warehouseId(warehouseId)
            .transactionType(transactionType)
            .direction(direction)
            .quantity(quantity)
            .quantityBefore(quantityBefore)
            .quantityAfter(quantityAfter)
            .unitCost(unitCost != null ? unitCost : stock.getUnitCost())
            .totalValue(unitCost != null ? unitCost.multiply(BigDecimal.valueOf(quantity)) : BigDecimal.ZERO)
            .reason(reason)
            .referenceType(referenceType)
            .referenceId(referenceId)
            .timestamp(LocalDateTime.now())
            .recordedBy(userId)
            .build();

        transactionRepository.save(transaction);

        log.info("Adjusted stock for product: {} by {} {} at warehouse: {}",
            productId, direction, quantity, warehouseId);

        return transaction;
    }

    /**
     * Transfer stock between warehouses
     */
    @Transactional
    public void transferStock(
        String productId,
        String fromWarehouseId,
        String toWarehouseId,
        Integer quantity,
        String reason
    ) {
        if (fromWarehouseId.equals(toWarehouseId)) {
            throw new BadRequestException("Cannot transfer to the same warehouse");
        }

        // Decrease from source warehouse
        adjustStock(
            productId,
            fromWarehouseId,
            quantity,
            StockTransaction.Direction.OUT,
            "Transfer to " + toWarehouseId + (reason != null ? ": " + reason : ""),
            null,
            "TRANSFER",
            toWarehouseId
        );

        // Increase in destination warehouse
        Stock sourceStock = stockRepository.findByTenantIdAndProductIdAndWarehouseId(
            getCurrentTenantId(), productId, fromWarehouseId
        ).orElseThrow();

        adjustStock(
            productId,
            toWarehouseId,
            quantity,
            StockTransaction.Direction.IN,
            "Transfer from " + fromWarehouseId + (reason != null ? ": " + reason : ""),
            sourceStock.getUnitCost(),
            "TRANSFER",
            fromWarehouseId
        );

        log.info("Transferred {} units of product: {} from {} to {}",
            quantity, productId, fromWarehouseId, toWarehouseId);
    }

    /**
     * Get stock by product (all warehouses)
     */
    public List<Stock> getStockByProduct(String productId) {
        String tenantId = getCurrentTenantId();
        return stockRepository.findByTenantIdAndProductId(tenantId, productId);
    }

    /**
     * Get stock by warehouse
     */
    public List<Stock> getStockByWarehouse(String warehouseId) {
        String tenantId = getCurrentTenantId();
        return stockRepository.findByTenantIdAndWarehouseId(tenantId, warehouseId);
    }

    /**
     * Get all stock (paginated)
     */
    public Page<Stock> getAllStock(Pageable pageable) {
        String tenantId = getCurrentTenantId();
        return stockRepository.findByTenantId(tenantId, pageable);
    }

    /**
     * Get low stock alerts
     */
    public List<Stock> getLowStockAlerts() {
        String tenantId = getCurrentTenantId();
        return stockRepository.findLowStockItems(tenantId);
    }

    /**
     * Get out of stock items
     */
    public List<Stock> getOutOfStockItems() {
        String tenantId = getCurrentTenantId();
        return stockRepository.findOutOfStockItems(tenantId);
    }

    /**
     * Update stock thresholds
     */
    @Transactional
    public Stock updateStockThresholds(
        String productId,
        String warehouseId,
        Integer reorderPoint,
        Integer reorderQuantity,
        Integer minimumLevel,
        Integer maximumLevel
    ) {
        Stock stock = getOrCreateStock(productId, warehouseId);

        if (reorderPoint != null) {
            stock.setReorderPoint(reorderPoint);
        }
        if (reorderQuantity != null) {
            stock.setReorderQuantity(reorderQuantity);
        }
        if (minimumLevel != null) {
            stock.setMinimumLevel(minimumLevel);
        }
        if (maximumLevel != null) {
            stock.setMaximumLevel(maximumLevel);
        }

        stock.setUpdatedAt(LocalDateTime.now());
        stock.setUpdatedBy(getCurrentUserId());

        return stockRepository.save(stock);
    }

    /**
     * Reserve stock (decrease available quantity)
     */
    @Transactional
    public void reserveStock(String productId, String warehouseId, Integer quantity) {
        Stock stock = getOrCreateStock(productId, warehouseId);

        if (stock.getQuantityAvailable() < quantity) {
            throw new BadRequestException(
                "Insufficient available stock. Available: " + stock.getQuantityAvailable() +
                ", Requested: " + quantity
            );
        }

        stock.setQuantityReserved(stock.getQuantityReserved() + quantity);
        stock.setQuantityAvailable(stock.getQuantityOnHand() - stock.getQuantityReserved());
        stock.setUpdatedAt(LocalDateTime.now());
        stock.setUpdatedBy(getCurrentUserId());

        stockRepository.save(stock);

        // Create transaction record
        String userId = getCurrentUserId();
        

        StockTransaction transaction = StockTransaction.builder()
            .transactionId(transactionIdGenerator.generateTransactionId())
            .tenantId(getCurrentTenantId())
            .productId(productId)
            .warehouseId(warehouseId)
            .transactionType(StockTransaction.TransactionType.RESERVED)
            .direction(StockTransaction.Direction.OUT)
            .quantity(quantity)
            .quantityBefore(stock.getQuantityAvailable() + quantity)
            .quantityAfter(stock.getQuantityAvailable())
            .reason("Stock reserved")
            .timestamp(LocalDateTime.now())
            .recordedBy(userId)
            .build();

        transactionRepository.save(transaction);

        log.info("Reserved {} units of product: {} at warehouse: {}",
            quantity, productId, warehouseId);
    }

    /**
     * Release reserved stock
     */
    @Transactional
    public void releaseReservedStock(String productId, String warehouseId, Integer quantity) {
        Stock stock = stockRepository.findByTenantIdAndProductIdAndWarehouseId(
            getCurrentTenantId(), productId, warehouseId
        ).orElseThrow(() -> new ResourceNotFoundException("Stock not found"));

        if (stock.getQuantityReserved() < quantity) {
            throw new BadRequestException("Cannot release more than reserved quantity");
        }

        stock.setQuantityReserved(stock.getQuantityReserved() - quantity);
        stock.setQuantityAvailable(stock.getQuantityOnHand() - stock.getQuantityReserved());
        stock.setUpdatedAt(LocalDateTime.now());
        stock.setUpdatedBy(getCurrentUserId());

        stockRepository.save(stock);

        // Create transaction record
        String userId = getCurrentUserId();
        

        StockTransaction transaction = StockTransaction.builder()
            .transactionId(transactionIdGenerator.generateTransactionId())
            .tenantId(getCurrentTenantId())
            .productId(productId)
            .warehouseId(warehouseId)
            .transactionType(StockTransaction.TransactionType.RELEASED)
            .direction(StockTransaction.Direction.IN)
            .quantity(quantity)
            .quantityBefore(stock.getQuantityAvailable() - quantity)
            .quantityAfter(stock.getQuantityAvailable())
            .reason("Reservation released")
            .timestamp(LocalDateTime.now())
            .recordedBy(userId)
            .build();

        transactionRepository.save(transaction);

        log.info("Released {} units of product: {} at warehouse: {}",
            quantity, productId, warehouseId);
    }

    /**
     * Update stock cost (weighted average)
     */
    private void updateCost(Stock stock, Integer addedQuantity, BigDecimal newUnitCost) {
        if (stock.getQuantityOnHand() == 0) {
            stock.setUnitCost(newUnitCost);
        } else {
            // Weighted average: (oldQty * oldCost + newQty * newCost) / (oldQty + newQty)
            BigDecimal oldTotal = stock.getUnitCost().multiply(BigDecimal.valueOf(stock.getQuantityOnHand()));
            BigDecimal newTotal = newUnitCost.multiply(BigDecimal.valueOf(addedQuantity));
            BigDecimal totalQuantity = BigDecimal.valueOf(stock.getQuantityOnHand() + addedQuantity);

            BigDecimal weightedAvg = oldTotal.add(newTotal).divide(totalQuantity, 2, BigDecimal.ROUND_HALF_UP);
            stock.setUnitCost(weightedAvg);
        }

        stock.setTotalValue(stock.getUnitCost().multiply(BigDecimal.valueOf(stock.getQuantityOnHand() + addedQuantity)));
    }

    /**
     * Get total stock value across all warehouses
     */
    public BigDecimal getTotalStockValue() {
        String tenantId = getCurrentTenantId();
        List<Stock> allStock = stockRepository.findByTenantId(tenantId);

        return allStock.stream()
            .map(stock -> stock.getTotalValue() != null ? stock.getTotalValue() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Get total stock count (unique products)
     */
    public long getTotalProductCount() {
        String tenantId = getCurrentTenantId();
        return stockRepository.countByTenantId(tenantId);
    }

    /**
     * Physical stock count update
     */
    @Transactional
    public StockTransaction physicalStockCount(
        String productId,
        String warehouseId,
        Integer countedQuantity,
        String notes
    ) {
        Stock stock = getOrCreateStock(productId, warehouseId);
        int difference = countedQuantity - stock.getQuantityOnHand();

        if (difference == 0) {
            stock.setLastCountedAt(LocalDateTime.now());
            stockRepository.save(stock);
            return null;
        }

        StockTransaction.Direction direction = difference > 0
            ? StockTransaction.Direction.IN
            : StockTransaction.Direction.OUT;

        String reason = "Physical count: " + (notes != null ? notes : "Variance found");

        StockTransaction transaction = adjustStock(
            productId,
            warehouseId,
            Math.abs(difference),
            direction,
            reason,
            stock.getUnitCost(),
            "PHYSICAL_COUNT",
            null
        );

        stock.setLastCountedAt(LocalDateTime.now());
        stockRepository.save(stock);

        return transaction;
    }

    /**
     * Sync price from Stock to Catalog when unitCost changes
     * Finds the mapped DynamicProduct and updates its UnitPrice attribute
     */
    private void syncPriceToCatalogAsync(String productId, BigDecimal newUnitCost) {
        try {
            String tenantId = getCurrentTenantId();
            log.info("Starting price sync to catalog for product {} with new unit cost {}",
                    productId, newUnitCost);

            // Find the ProductMapping by structured product ID
            Optional<ProductMapping> mappingOpt = productMappingRepository
                    .findByTenantIdAndStructuredProductId(tenantId, productId)
                    .stream()
                    .findFirst();

            if (mappingOpt.isEmpty()) {
                log.warn("❌ No product mapping found for product {} (tenant: {}), skipping price sync. " +
                        "Make sure the product has inventory tracking enabled.", productId, tenantId);
                return;
            }

            ProductMapping mapping = mappingOpt.get();
            log.info("Found mapping: {} -> {} (priceSyncEnabled: {})",
                    mapping.getStructuredProductId(), mapping.getDynamicProductId(), mapping.isPriceSyncEnabled());

            if (!mapping.isPriceSyncEnabled()) {
                log.warn("❌ Price sync disabled for product {}, skipping. Enable it in ProductMapping.", productId);
                return;
            }

            // Find and update DynamicProduct UnitPrice attribute
            DynamicProduct dynamicProduct = dynamicProductRepository.findById(mapping.getDynamicProductId())
                    .orElse(null);

            if (dynamicProduct == null) {
                log.error("❌ DynamicProduct not found for mapping {} (dynamicProductId: {})",
                        mapping.getId(), mapping.getDynamicProductId());
                return;
            }

            log.info("Found DynamicProduct: {} with {} attributes",
                    dynamicProduct.getDisplayName(),
                    dynamicProduct.getAttributes() != null ? dynamicProduct.getAttributes().size() : 0);

            boolean updated = false;
            if (dynamicProduct.getAttributes() != null) {
                for (DynamicProduct.ProductAttribute attr : dynamicProduct.getAttributes()) {
                    String key = attr.getKey().toLowerCase();
                    log.debug("Checking attribute: {} (key: {})", attr.getKey(), key);
                    if ("UnitPrice".equalsIgnoreCase(key)) {
                        String oldValue = attr.getValue();
                        attr.setValue(newUnitCost.toString());
                        updated = true;
                        log.info("✅ Synced price to catalog: {} -> {} (was: {}) [Inventory → Catalog]",
                                attr.getKey(), newUnitCost, oldValue);
                        break;
                    }
                }
            }

            if (updated) {
                dynamicProduct.setLastModifiedAt(LocalDateTime.now());
                dynamicProductRepository.save(dynamicProduct);

                // Update mapping sync metadata
                mapping.setLastPriceSyncedAt(LocalDateTime.now());
                mapping.setLastPriceSyncDirection(ProductMapping.PriceSyncDirection.INVENTORY_TO_CATALOG);
                productMappingRepository.save(mapping);

                log.info("✅ Price sync completed successfully for product {}", productId);
            } else {
                log.warn("❌ No price attribute found in catalog product {}. Attributes: {}",
                        productId,
                        dynamicProduct.getAttributes() != null
                            ? dynamicProduct.getAttributes().stream()
                                .map(DynamicProduct.ProductAttribute::getKey)
                                .collect(java.util.stream.Collectors.joining(", "))
                            : "none");
            }
        } catch (Exception e) {
            log.error("❌ Failed to sync price to catalog for product {}: {}",
                    productId, e.getMessage(), e);
            // Don't fail the stock transaction if sync fails
        }
    }

    /**
     * Update unit cost directly without stock movement
     * Useful for price adjustments or selling at different prices
     */
    @Transactional
    public Stock updateUnitCost(String productId, String warehouseId, BigDecimal newUnitCost, String reason) {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();

        if (newUnitCost.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Unit cost cannot be negative");
        }

        Stock stock = stockRepository.findByTenantIdAndProductIdAndWarehouseId(tenantId, productId, warehouseId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Stock not found for product " + productId + " at warehouse " + warehouseId
            ));

        log.info("Updating unit cost for product {} at warehouse {} from {} to {}. Reason: {}",
            productId, warehouseId, stock.getUnitCost(), newUnitCost, reason);

        // Update unit cost and recalculate total value
        stock.setUnitCost(newUnitCost);
        stock.setTotalValue(newUnitCost.multiply(BigDecimal.valueOf(stock.getQuantityOnHand())));
        stock.setUpdatedAt(LocalDateTime.now());
        stock.setUpdatedBy(userId);

        Stock updated = stockRepository.save(stock);

        // Sync price to catalog (bidirectional)
        syncPriceToCatalogAsync(productId, newUnitCost);

        log.info("Successfully updated unit cost for product {} at warehouse {} to {}",
            productId, warehouseId, newUnitCost);

        return updated;
    }

    /**
     * Enrich StockResponse with product and warehouse details
     * Adds product name, catalog product ID, and warehouse name
     */
    public com.ultron.backend.dto.response.inventory.StockResponse enrichStockResponse(
            com.ultron.backend.dto.response.inventory.StockResponse response) {
        try {
            String tenantId = getCurrentTenantId();

            // Get structured product details
            structuredProductRepository.findById(response.getProductId())
                .ifPresent(product -> {
                    response.setProductName(product.getProductName());

                    // Find product mapping to get catalog product ID
                    productMappingRepository
                        .findByTenantIdAndStructuredProductId(tenantId, product.getId())
                        .stream()
                        .findFirst()
                        .ifPresent(mapping -> response.setCatalogProductId(mapping.getDynamicProductId()));
                });

            // Get warehouse details
            try {
                Warehouse warehouse = warehouseService.getWarehouseById(response.getWarehouseId());
                response.setWarehouseName(warehouse.getName());
                response.setWarehouseCode(warehouse.getCode());
            } catch (Exception e) {
                log.debug("Could not fetch warehouse details for {}: {}",
                    response.getWarehouseId(), e.getMessage());
            }
        } catch (Exception e) {
            log.warn("Failed to enrich stock response for product {}: {}",
                response.getProductId(), e.getMessage());
        }
        return response;
    }
}
