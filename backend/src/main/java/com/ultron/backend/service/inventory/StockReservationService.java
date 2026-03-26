package com.ultron.backend.service.inventory;

import com.ultron.backend.domain.entity.Stock;
import com.ultron.backend.domain.entity.StockReservation;
import com.ultron.backend.exception.BadRequestException;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.multitenancy.TenantContext;
import com.ultron.backend.repository.StockReservationRepository;
import com.ultron.backend.service.BaseTenantService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for stock reservation management
 * Handles reserving stock for quotes, proposals, and orders
 */
@Slf4j
@Service
public class StockReservationService extends BaseTenantService {

    private final StockReservationRepository reservationRepository;
    private final StockService stockService;

    public StockReservationService(
        StockReservationRepository reservationRepository,
        StockService stockService
    ) {
        this.reservationRepository = reservationRepository;
        this.stockService = stockService;
    }

    /**
     * Reserve stock for a quote/proposal/order
     */
    @Transactional
    public StockReservation reserveStock(
        String productId,
        String warehouseId,
        Integer quantity,
        String referenceType,
        String referenceId,
        String referenceNumber,
        Integer expiryDays
    ) {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();
        

        if (quantity == null || quantity <= 0) {
            throw new BadRequestException("Quantity must be greater than zero");
        }

        // Reserve stock in stock service
        stockService.reserveStock(productId, warehouseId, quantity);

        // Create reservation record
        LocalDateTime expiresAt = expiryDays != null
            ? LocalDateTime.now().plusDays(expiryDays)
            : LocalDateTime.now().plusDays(7); // Default 7 days

        StockReservation reservation = StockReservation.builder()
            .tenantId(tenantId)
            .productId(productId)
            .warehouseId(warehouseId)
            .quantity(quantity)
            .referenceType(referenceType)
            .referenceId(referenceId)
            .referenceNumber(referenceNumber)
            .status(StockReservation.ReservationStatus.ACTIVE)
            .expiresAt(expiresAt)
            .autoReleaseEnabled(true)
            .createdAt(LocalDateTime.now())
            .createdBy(userId)
            .build();

        reservationRepository.save(reservation);

        log.info("Reserved {} units of product {} for {} {}",
            quantity, productId, referenceType, referenceNumber);

        return reservation;
    }

    /**
     * Release reservation (when cancelled or expired)
     */
    @Transactional
    public void releaseReservation(String reservationId) {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();
        

        StockReservation reservation = reservationRepository.findByIdAndTenantId(reservationId, tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Reservation not found: " + reservationId));

        if (reservation.getStatus() != StockReservation.ReservationStatus.ACTIVE) {
            throw new BadRequestException("Reservation is not active");
        }

        // Release stock
        stockService.releaseReservedStock(
            reservation.getProductId(),
            reservation.getWarehouseId(),
            reservation.getQuantity()
        );

        // Update reservation status
        reservation.setStatus(StockReservation.ReservationStatus.RELEASED);
        reservation.setLastModifiedAt(LocalDateTime.now());
        reservation.setLastModifiedBy(userId);

        reservationRepository.save(reservation);

        log.info("Released reservation {} for {} units of product {}",
            reservationId, reservation.getQuantity(), reservation.getProductId());
    }

    /**
     * Fulfill reservation (convert to actual sale/order)
     */
    @Transactional
    public void fulfillReservation(String reservationId) {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();
        

        StockReservation reservation = reservationRepository.findByIdAndTenantId(reservationId, tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Reservation not found: " + reservationId));

        if (reservation.getStatus() != StockReservation.ReservationStatus.ACTIVE) {
            throw new BadRequestException("Reservation is not active");
        }

        // Note: Stock is already reserved, no need to adjust again
        // Just mark reservation as fulfilled

        reservation.setStatus(StockReservation.ReservationStatus.FULFILLED);
        reservation.setFulfilledAt(LocalDateTime.now());
        reservation.setFulfilledBy(userId);

        reservationRepository.save(reservation);

        log.info("Fulfilled reservation {} for {} units of product {}",
            reservationId, reservation.getQuantity(), reservation.getProductId());
    }

    /**
     * Cancel reservation
     */
    @Transactional
    public void cancelReservation(String reservationId, String reason) {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();
        

        StockReservation reservation = reservationRepository.findByIdAndTenantId(reservationId, tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Reservation not found: " + reservationId));

        if (reservation.getStatus() != StockReservation.ReservationStatus.ACTIVE) {
            throw new BadRequestException("Reservation is not active");
        }

        // Release stock
        stockService.releaseReservedStock(
            reservation.getProductId(),
            reservation.getWarehouseId(),
            reservation.getQuantity()
        );

        // Update reservation status
        reservation.setStatus(StockReservation.ReservationStatus.CANCELLED);
        reservation.setNotes((reservation.getNotes() != null ? reservation.getNotes() + "\n" : "") +
                           "Cancelled: " + reason);
        reservation.setLastModifiedAt(LocalDateTime.now());
        reservation.setLastModifiedBy(userId);

        reservationRepository.save(reservation);

        log.info("Cancelled reservation {} - Reason: {}", reservationId, reason);
    }

    /**
     * Get reservations by reference (quote, proposal, order)
     */
    public List<StockReservation> getReservationsByReference(String referenceType, String referenceId) {
        String tenantId = getCurrentTenantId();
        return reservationRepository.findByTenantIdAndReferenceTypeAndReferenceId(
            tenantId, referenceType, referenceId
        );
    }

    /**
     * Get active reservations by product
     */
    public List<StockReservation> getActiveReservationsByProduct(String productId) {
        String tenantId = getCurrentTenantId();
        return reservationRepository.findByTenantIdAndProductIdAndStatus(
            tenantId, productId, StockReservation.ReservationStatus.ACTIVE
        );
    }

    /**
     * Get reservation by ID
     */
    public StockReservation getReservationById(String id) {
        String tenantId = getCurrentTenantId();
        return reservationRepository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Reservation not found: " + id));
    }

    /**
     * Get all active reservations
     */
    public List<StockReservation> getActiveReservations() {
        String tenantId = getCurrentTenantId();
        return reservationRepository.findByTenantIdAndStatus(
            tenantId, StockReservation.ReservationStatus.ACTIVE
        );
    }

    /**
     * Auto-release expired reservations (scheduled job - runs every hour)
     * Processes reservations across ALL tenants in the system
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void autoReleaseExpiredReservations() {
        log.info("Running auto-release of expired reservations");

        // Get expired reservations across ALL tenants
        List<StockReservation> expiredReservations =
            reservationRepository.findExpiredReservationsAllTenants(LocalDateTime.now());

        if (expiredReservations.isEmpty()) {
            log.info("No expired reservations found");
            return;
        }

        log.info("Found {} expired reservation(s) to process", expiredReservations.size());

        int releasedCount = 0;
        for (StockReservation reservation : expiredReservations) {
            // Set tenant context for this reservation
            TenantContext.setTenantId(reservation.getTenantId());

            try {
                // Release stock
                stockService.releaseReservedStock(
                    reservation.getProductId(),
                    reservation.getWarehouseId(),
                    reservation.getQuantity()
                );

                // Mark as expired
                reservation.setStatus(StockReservation.ReservationStatus.EXPIRED);
                reservation.setLastModifiedAt(LocalDateTime.now());
                reservation.setLastModifiedBy("SYSTEM");
                reservationRepository.save(reservation);

                releasedCount++;

                log.info("Auto-released expired reservation {} for product {} (tenant: {})",
                    reservation.getId(), reservation.getProductId(), reservation.getTenantId());

            } catch (Exception e) {
                log.error("Failed to auto-release reservation {} (tenant: {}): {}",
                    reservation.getId(), reservation.getTenantId(), e.getMessage());
            } finally {
                // Always clear tenant context after processing each reservation
                TenantContext.clear();
            }
        }

        if (releasedCount > 0) {
            log.info("Successfully auto-released {} expired reservations", releasedCount);
        }
    }

    /**
     * Extend reservation expiry
     */
    @Transactional
    public StockReservation extendReservation(String reservationId, Integer additionalDays) {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();
        

        StockReservation reservation = reservationRepository.findByIdAndTenantId(reservationId, tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Reservation not found: " + reservationId));

        if (reservation.getStatus() != StockReservation.ReservationStatus.ACTIVE) {
            throw new BadRequestException("Can only extend active reservations");
        }

        reservation.setExpiresAt(reservation.getExpiresAt().plusDays(additionalDays));
        reservation.setLastModifiedAt(LocalDateTime.now());
        reservation.setLastModifiedBy(userId);

        reservationRepository.save(reservation);

        log.info("Extended reservation {} by {} days", reservationId, additionalDays);

        return reservation;
    }

    /**
     * Get total reserved quantity for a product
     */
    public Integer getTotalReservedQuantity(String productId) {
        String tenantId = getCurrentTenantId();
        List<StockReservation> reservations = reservationRepository.findByTenantIdAndProductIdAndStatus(
            tenantId, productId, StockReservation.ReservationStatus.ACTIVE
        );

        return reservations.stream()
            .mapToInt(StockReservation::getQuantity)
            .sum();
    }
}
