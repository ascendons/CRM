package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.StockReservation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for StockReservation entity
 */
@Repository
public interface StockReservationRepository extends MongoRepository<StockReservation, String> {

    // Find by tenant
    List<StockReservation> findByTenantId(String tenantId);

    Page<StockReservation> findByTenantId(String tenantId, Pageable pageable);

    // Find by product
    List<StockReservation> findByTenantIdAndProductId(String tenantId, String productId);

    List<StockReservation> findByTenantIdAndProductIdAndStatus(
        String tenantId, String productId, StockReservation.ReservationStatus status
    );

    // Find by warehouse
    List<StockReservation> findByTenantIdAndWarehouseId(String tenantId, String warehouseId);

    // Find by reference
    List<StockReservation> findByTenantIdAndReferenceTypeAndReferenceId(
        String tenantId, String referenceType, String referenceId
    );

    Optional<StockReservation> findByTenantIdAndReferenceTypeAndReferenceIdAndStatus(
        String tenantId, String referenceType, String referenceId,
        StockReservation.ReservationStatus status
    );

    // Find by status
    List<StockReservation> findByTenantIdAndStatus(
        String tenantId, StockReservation.ReservationStatus status
    );

    Page<StockReservation> findByTenantIdAndStatus(
        String tenantId, StockReservation.ReservationStatus status, Pageable pageable
    );

    // Find active reservations
    List<StockReservation> findByTenantIdAndStatusAndExpiresAtAfter(
        String tenantId, StockReservation.ReservationStatus status, LocalDateTime now
    );

    // Find expired reservations
    @Query("{ 'tenantId': ?0, 'status': 'ACTIVE', 'expiresAt': { $lte: ?1 }, 'autoReleaseEnabled': true }")
    List<StockReservation> findExpiredReservations(String tenantId, LocalDateTime now);

    /**
     * ⚠️ SYSTEM SCHEDULED TASK ONLY - Find expired reservations across ALL tenants
     * Use ONLY in scheduled background jobs
     */
    @Query("{ 'status': 'ACTIVE', 'expiresAt': { $lte: ?0 }, 'autoReleaseEnabled': true }")
    List<StockReservation> findExpiredReservationsAllTenants(LocalDateTime now);

    // Find by ID and tenant (for security)
    Optional<StockReservation> findByIdAndTenantId(String id, String tenantId);

    // Find by customer
    List<StockReservation> findByTenantIdAndCustomerId(String tenantId, String customerId);

    // Count reservations
    long countByTenantId(String tenantId);

    long countByTenantIdAndStatus(
        String tenantId, StockReservation.ReservationStatus status
    );

    long countByTenantIdAndProductIdAndStatus(
        String tenantId, String productId, StockReservation.ReservationStatus status
    );
}
