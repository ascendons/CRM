package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.PurchaseOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository for PurchaseOrder entity
 */
@Repository
public interface PurchaseOrderRepository extends MongoRepository<PurchaseOrder, String> {

    // Find by tenant
    List<PurchaseOrder> findByTenantId(String tenantId);

    Page<PurchaseOrder> findByTenantId(String tenantId, Pageable pageable);

    // Find by PO number
    Optional<PurchaseOrder> findByTenantIdAndPoNumber(String tenantId, String poNumber);

    // Check if PO number exists
    boolean existsByTenantIdAndPoNumber(String tenantId, String poNumber);

    // Find by status
    List<PurchaseOrder> findByTenantIdAndStatus(String tenantId, PurchaseOrder.POStatus status);

    Page<PurchaseOrder> findByTenantIdAndStatus(
        String tenantId, PurchaseOrder.POStatus status, Pageable pageable
    );

    // Find by multiple statuses
    List<PurchaseOrder> findByTenantIdAndStatusIn(
        String tenantId, List<PurchaseOrder.POStatus> statuses
    );

    // Find by supplier
    List<PurchaseOrder> findByTenantIdAndSupplierId(String tenantId, String supplierId);

    Page<PurchaseOrder> findByTenantIdAndSupplierId(
        String tenantId, String supplierId, Pageable pageable
    );

    // Find by warehouse
    List<PurchaseOrder> findByTenantIdAndWarehouseId(String tenantId, String warehouseId);

    Page<PurchaseOrder> findByTenantIdAndWarehouseId(
        String tenantId, String warehouseId, Pageable pageable
    );

    // Find by ID and tenant (for security)
    Optional<PurchaseOrder> findByIdAndTenantId(String id, String tenantId);

    // Find by date range
    @Query("{ 'tenantId': ?0, 'orderDate': { $gte: ?1, $lte: ?2 } }")
    List<PurchaseOrder> findByTenantIdAndOrderDateBetween(
        String tenantId, LocalDate startDate, LocalDate endDate
    );

    // Find pending approval
    List<PurchaseOrder> findByTenantIdAndStatusOrderByCreatedAtDesc(
        String tenantId, PurchaseOrder.POStatus status
    );

    // Find overdue POs
    @Query("{ 'tenantId': ?0, 'status': { $in: ['APPROVED', 'SENT', 'RECEIVING'] }, " +
           "'expectedDeliveryDate': { $lt: ?1 } }")
    List<PurchaseOrder> findOverduePurchaseOrders(String tenantId, LocalDate today);

    // Recent POs
    Page<PurchaseOrder> findByTenantIdOrderByCreatedAtDesc(String tenantId, Pageable pageable);

    // Count POs
    long countByTenantId(String tenantId);

    long countByTenantIdAndStatus(String tenantId, PurchaseOrder.POStatus status);
}
