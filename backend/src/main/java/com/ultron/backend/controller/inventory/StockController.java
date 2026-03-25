package com.ultron.backend.controller.inventory;

import com.ultron.backend.domain.entity.Stock;
import com.ultron.backend.domain.entity.StockTransaction;
import com.ultron.backend.dto.request.inventory.StockAdjustmentRequest;
import com.ultron.backend.dto.request.inventory.StockTransferRequest;
import com.ultron.backend.dto.response.inventory.StockResponse;
import com.ultron.backend.dto.response.inventory.StockTransactionResponse;
import com.ultron.backend.mapper.InventoryMapper;
import com.ultron.backend.service.inventory.StockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

/**
 * REST Controller for stock management
 */
@Slf4j
@RestController
@RequestMapping("/inventory/stock")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;
    private final InventoryMapper mapper;

    /**
     * Get or create stock by product and warehouse
     */
    @GetMapping
    public ResponseEntity<StockResponse> getStock(
        @RequestParam String productId,
        @RequestParam String warehouseId
    ) {
        Stock stock = stockService.getOrCreateStock(productId, warehouseId);
        return ResponseEntity.ok(mapper.toStockResponse(stock));
    }

    /**
     * Get all stock for a product across all warehouses
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<StockResponse>> getStockByProduct(@PathVariable String productId) {
        List<Stock> stocks = stockService.getStockByProduct(productId);
        return ResponseEntity.ok(
            stocks.stream()
                .map(mapper::toStockResponse)
                .collect(Collectors.toList())
        );
    }

    /**
     * Get all stock in a warehouse
     */
    @GetMapping("/warehouse/{warehouseId}")
    public ResponseEntity<List<StockResponse>> getStockByWarehouse(@PathVariable String warehouseId) {
        List<Stock> stocks = stockService.getStockByWarehouse(warehouseId);
        return ResponseEntity.ok(
            stocks.stream()
                .map(mapper::toStockResponse)
                .collect(Collectors.toList())
        );
    }

    /**
     * Get all stock (paginated)
     */
    @GetMapping("/all")
    public ResponseEntity<Page<StockResponse>> getAllStock(Pageable pageable) {
        Page<Stock> stocks = stockService.getAllStock(pageable);
        return ResponseEntity.ok(stocks.map(mapper::toStockResponse));
    }

    /**
     * Adjust stock (IN or OUT)
     */
    @PostMapping("/adjust")
    public ResponseEntity<StockTransactionResponse> adjustStock(
        @Valid @RequestBody StockAdjustmentRequest request
    ) {
        log.info("Adjusting stock for product {} at warehouse {}: {} {}",
            request.getProductId(), request.getWarehouseId(),
            request.getDirection(), request.getQuantity());

        StockTransaction.Direction direction = StockTransaction.Direction.valueOf(request.getDirection());

        StockTransaction transaction = stockService.adjustStock(
            request.getProductId(),
            request.getWarehouseId(),
            request.getQuantity(),
            direction,
            request.getReason(),
            request.getUnitCost(),
            request.getReferenceType(),
            request.getReferenceId()
        );

        return ResponseEntity.ok(mapper.toStockTransactionResponse(transaction));
    }

    /**
     * Transfer stock between warehouses
     */
    @PostMapping("/transfer")
    public ResponseEntity<Void> transferStock(
        @Valid @RequestBody StockTransferRequest request
    ) {
        log.info("Transferring {} units of product {} from warehouse {} to {}",
            request.getQuantity(), request.getProductId(),
            request.getFromWarehouseId(), request.getToWarehouseId());

        stockService.transferStock(
            request.getProductId(),
            request.getFromWarehouseId(),
            request.getToWarehouseId(),
            request.getQuantity(),
            request.getReason()
        );

        return ResponseEntity.ok().build();
    }

    /**
     * Get out of stock items
     */
    @GetMapping("/out-of-stock")
    public ResponseEntity<List<StockResponse>> getOutOfStockItems() {
        List<Stock> outOfStockItems = stockService.getOutOfStockItems();
        return ResponseEntity.ok(
            outOfStockItems.stream()
                .map(mapper::toStockResponse)
                .collect(Collectors.toList())
        );
    }

    /**
     * Get low stock alerts
     */
    @GetMapping("/alerts/low-stock")
    public ResponseEntity<List<StockResponse>> getLowStockAlerts() {
        List<Stock> lowStockItems = stockService.getLowStockAlerts();
        return ResponseEntity.ok(
            lowStockItems.stream()
                .map(mapper::toStockResponse)
                .collect(Collectors.toList())
        );
    }

    /**
     * Get total product count
     */
    @GetMapping("/count/products")
    public ResponseEntity<Long> getTotalProductCount() {
        return ResponseEntity.ok(stockService.getTotalProductCount());
    }

    /**
     * Get total stock value
     */
    @GetMapping("/value/total")
    public ResponseEntity<java.math.BigDecimal> getTotalStockValue() {
        return ResponseEntity.ok(stockService.getTotalStockValue());
    }

    /**
     * Update stock thresholds
     */
    @PutMapping("/thresholds")
    public ResponseEntity<StockResponse> updateStockThresholds(
        @RequestParam String productId,
        @RequestParam String warehouseId,
        @RequestParam Integer reorderPoint,
        @RequestParam Integer reorderQuantity,
        @RequestParam(required = false) Integer minimumLevel,
        @RequestParam(required = false) Integer maximumLevel
    ) {
        Stock updated = stockService.updateStockThresholds(
            productId, warehouseId, reorderPoint, reorderQuantity, minimumLevel, maximumLevel
        );
        return ResponseEntity.ok(mapper.toStockResponse(updated));
    }

    /**
     * Perform physical stock count
     */
    @PostMapping("/physical-count")
    public ResponseEntity<StockTransactionResponse> performPhysicalCount(
        @RequestParam String productId,
        @RequestParam String warehouseId,
        @RequestParam Integer actualCount,
        @RequestParam(required = false) String notes
    ) {
        log.info("Performing physical count for product {} at warehouse {}: {}",
            productId, warehouseId, actualCount);

        StockTransaction transaction = stockService.physicalStockCount(
            productId, warehouseId, actualCount, notes
        );

        return ResponseEntity.ok(mapper.toStockTransactionResponse(transaction));
    }
}
