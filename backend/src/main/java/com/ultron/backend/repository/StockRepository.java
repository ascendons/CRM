package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Stock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Stock entity
 */
@Repository
public interface StockRepository extends MongoRepository<Stock, String> {

    // Find by tenant
    List<Stock> findByTenantId(String tenantId);

    Page<Stock> findByTenantId(String tenantId, Pageable pageable);

    // Find by product
    List<Stock> findByTenantIdAndProductId(String tenantId, String productId);

    Optional<Stock> findByTenantIdAndProductIdAndWarehouseId(
        String tenantId, String productId, String warehouseId
    );

    // Find by warehouse
    List<Stock> findByTenantIdAndWarehouseId(String tenantId, String warehouseId);

    Page<Stock> findByTenantIdAndWarehouseId(String tenantId, String warehouseId, Pageable pageable);

    // Find by ID and tenant (for security)
    Optional<Stock> findByIdAndTenantId(String id, String tenantId);

    // Low stock alerts
    @Query("{ 'tenantId': ?0, 'quantityAvailable': { $lt: ?1 } }")
    List<Stock> findByTenantIdAndQuantityAvailableLessThan(String tenantId, Integer threshold);

    // Low stock with reorder point
    @Query("{ 'tenantId': ?0, 'quantityAvailable': { $lte: '$reorderPoint' }, 'reorderPoint': { $gt: 0 } }")
    List<Stock> findLowStockItems(String tenantId);

    // Out of stock
    @Query("{ 'tenantId': ?0, 'quantityAvailable': { $lte: 0 } }")
    List<Stock> findOutOfStockItems(String tenantId);

    // Has reserved stock
    @Query("{ 'tenantId': ?0, 'quantityReserved': { $gt: 0 } }")
    List<Stock> findStocksWithReservations(String tenantId);

    // Check if stock exists
    boolean existsByTenantIdAndProductIdAndWarehouseId(
        String tenantId, String productId, String warehouseId
    );

    // Count stocks
    long countByTenantId(String tenantId);

    long countByTenantIdAndWarehouseId(String tenantId, String warehouseId);
}
