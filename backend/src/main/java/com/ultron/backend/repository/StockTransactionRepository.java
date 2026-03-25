package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.StockTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for StockTransaction entity
 */
@Repository
public interface StockTransactionRepository extends MongoRepository<StockTransaction, String> {

    // Find by tenant
    Page<StockTransaction> findByTenantId(String tenantId, Pageable pageable);

    // Find by product
    List<StockTransaction> findByTenantIdAndProductId(String tenantId, String productId);

    Page<StockTransaction> findByTenantIdAndProductIdOrderByTimestampDesc(
        String tenantId, String productId, Pageable pageable
    );

    // Find by warehouse
    List<StockTransaction> findByTenantIdAndWarehouseId(String tenantId, String warehouseId);

    Page<StockTransaction> findByTenantIdAndWarehouseIdOrderByTimestampDesc(
        String tenantId, String warehouseId, Pageable pageable
    );

    // Find by transaction type
    List<StockTransaction> findByTenantIdAndTransactionType(
        String tenantId, StockTransaction.TransactionType type
    );

    // Find by reference
    List<StockTransaction> findByTenantIdAndReferenceTypeAndReferenceId(
        String tenantId, String referenceType, String referenceId
    );

    // Find by ID and tenant (for security)
    Optional<StockTransaction> findByIdAndTenantId(String id, String tenantId);

    // Find by transaction ID
    Optional<StockTransaction> findByTenantIdAndTransactionId(String tenantId, String transactionId);

    // Find by date range
    @Query("{ 'tenantId': ?0, 'timestamp': { $gte: ?1, $lte: ?2 } }")
    List<StockTransaction> findByTenantIdAndTimestampBetween(
        String tenantId, LocalDateTime startDate, LocalDateTime endDate
    );

    Page<StockTransaction> findByTenantIdAndTimestampBetween(
        String tenantId, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable
    );

    // Recent transactions
    Page<StockTransaction> findByTenantIdOrderByTimestampDesc(String tenantId, Pageable pageable);

    // Count transactions
    long countByTenantId(String tenantId);

    long countByTenantIdAndProductId(String tenantId, String productId);

    long countByTenantIdAndTransactionType(
        String tenantId, StockTransaction.TransactionType type
    );
}
