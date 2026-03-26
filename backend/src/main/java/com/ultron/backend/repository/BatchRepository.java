package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Batch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository for Batch entity
 */
@Repository
public interface BatchRepository extends MongoRepository<Batch, String> {

    // Find by tenant
    List<Batch> findByTenantId(String tenantId);

    Page<Batch> findByTenantId(String tenantId, Pageable pageable);

    // Find by product
    List<Batch> findByTenantIdAndProductId(String tenantId, String productId);

    List<Batch> findByTenantIdAndProductIdAndStatus(
        String tenantId, String productId, Batch.BatchStatus status
    );

    // Find by batch number
    Optional<Batch> findByTenantIdAndProductIdAndBatchNumber(
        String tenantId, String productId, String batchNumber
    );

    // Check if batch exists
    boolean existsByTenantIdAndProductIdAndBatchNumber(
        String tenantId, String productId, String batchNumber
    );

    // Find by warehouse
    List<Batch> findByTenantIdAndWarehouseId(String tenantId, String warehouseId);

    // Find by status
    List<Batch> findByTenantIdAndStatus(String tenantId, Batch.BatchStatus status);

    Page<Batch> findByTenantIdAndStatus(
        String tenantId, Batch.BatchStatus status, Pageable pageable
    );

    // Find by ID and tenant (for security)
    Optional<Batch> findByIdAndTenantId(String id, String tenantId);

    // Find expiring soon
    @Query("{ 'tenantId': ?0, 'status': 'ACTIVE', 'expiryDate': { $gte: ?1, $lte: ?2 } }")
    List<Batch> findBatchesExpiringSoon(String tenantId, LocalDate startDate, LocalDate endDate);

    // Find expired batches
    @Query("{ 'tenantId': ?0, 'status': 'ACTIVE', 'expiryDate': { $lt: ?1 } }")
    List<Batch> findExpiredBatches(String tenantId, LocalDate today);

    /**
     * ⚠️ SYSTEM SCHEDULED TASK ONLY - Find expired batches across ALL tenants
     * Use ONLY in scheduled background jobs
     */
    @Query("{ 'status': 'ACTIVE', 'expiryDate': { $lt: ?0 } }")
    List<Batch> findExpiredBatchesAllTenants(LocalDate today);

    // Find recalled batches
    List<Batch> findByTenantIdAndIsRecalledTrue(String tenantId);

    // Find by supplier
    List<Batch> findByTenantIdAndSupplierId(String tenantId, String supplierId);

    // Find batches with available quantity
    @Query("{ 'tenantId': ?0, 'productId': ?1, 'status': 'ACTIVE', 'quantityAvailable': { $gt: 0 } }")
    List<Batch> findAvailableBatchesByProduct(String tenantId, String productId);

    // Count batches
    long countByTenantId(String tenantId);

    long countByTenantIdAndStatus(String tenantId, Batch.BatchStatus status);

    long countByTenantIdAndProductId(String tenantId, String productId);
}
