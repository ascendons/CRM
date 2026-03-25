package com.ultron.backend.service.inventory;

import com.ultron.backend.domain.entity.DynamicProduct;
import com.ultron.backend.domain.entity.Stock;
import com.ultron.backend.domain.entity.StockTransaction;
import com.ultron.backend.domain.entity.Warehouse;
import com.ultron.backend.exception.BadRequestException;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.DynamicProductRepository;
import com.ultron.backend.repository.StockRepository;
import com.ultron.backend.repository.StockTransactionRepository;
import com.ultron.backend.service.BaseTenantService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for stock management operations
 */
@Slf4j
@Service
public class StockService extends BaseTenantService {

    private final StockRepository stockRepository;
    private final StockTransactionRepository transactionRepository;
    private final DynamicProductRepository productRepository;
    private final WarehouseService warehouseService;
    private final TransactionIdGeneratorService transactionIdGenerator;

    public StockService(
        StockRepository stockRepository,
        StockTransactionRepository transactionRepository,
        DynamicProductRepository productRepository,
        WarehouseService warehouseService,
        TransactionIdGeneratorService transactionIdGenerator
    ) {
        this.stockRepository = stockRepository;
        this.transactionRepository = transactionRepository;
        this.productRepository = productRepository;
        this.warehouseService = warehouseService;
        this.transactionIdGenerator = transactionIdGenerator;
    }

    /**
     * Get or create stock record
     */
    @Transactional
    public Stock getOrCreateStock(String productId, String warehouseId) {
        String tenantId = getCurrentTenantId();

        // Validate product exists
        productRepository.findByProductIdAndTenantId(productId, tenantId)
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
}
