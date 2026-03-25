package com.ultron.backend.controller.inventory;

import com.ultron.backend.domain.entity.StockReservation;
import com.ultron.backend.dto.request.inventory.CreateReservationRequest;
import com.ultron.backend.dto.response.inventory.StockReservationResponse;
import com.ultron.backend.mapper.InventoryMapper;
import com.ultron.backend.service.inventory.StockReservationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

/**
 * REST Controller for stock reservation management
 */
@Slf4j
@RestController
@RequestMapping("/inventory/reservations")
@RequiredArgsConstructor
public class StockReservationController {

    private final StockReservationService reservationService;
    private final InventoryMapper mapper;

    /**
     * Create a new stock reservation
     */
    @PostMapping
    public ResponseEntity<StockReservationResponse> createReservation(
        @Valid @RequestBody CreateReservationRequest request
    ) {
        log.info("Creating stock reservation for product {} - {} units",
            request.getProductId(), request.getQuantity());

        StockReservation reservation = reservationService.reserveStock(
            request.getProductId(),
            request.getWarehouseId(),
            request.getQuantity(),
            request.getReferenceType(),
            request.getReferenceId(),
            request.getReferenceNumber(),
            request.getExpiryDays()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toStockReservationResponse(reservation));
    }

    /**
     * Get reservation by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<StockReservationResponse> getReservationById(@PathVariable String id) {
        StockReservation reservation = reservationService.getReservationById(id);
        return ResponseEntity.ok(mapper.toStockReservationResponse(reservation));
    }

    /**
     * Get reservations by reference (quote, proposal, order)
     */
    @GetMapping("/reference")
    public ResponseEntity<List<StockReservationResponse>> getReservationsByReference(
        @RequestParam String referenceType,
        @RequestParam String referenceId
    ) {
        List<StockReservation> reservations = reservationService.getReservationsByReference(
            referenceType, referenceId
        );
        return ResponseEntity.ok(
            reservations.stream()
                .map(mapper::toStockReservationResponse)
                .collect(Collectors.toList())
        );
    }

    /**
     * Get active reservations by product
     */
    @GetMapping("/product/{productId}/active")
    public ResponseEntity<List<StockReservationResponse>> getActiveReservationsByProduct(
        @PathVariable String productId
    ) {
        List<StockReservation> reservations = reservationService.getActiveReservationsByProduct(productId);
        return ResponseEntity.ok(
            reservations.stream()
                .map(mapper::toStockReservationResponse)
                .collect(Collectors.toList())
        );
    }

    /**
     * Get all active reservations
     */
    @GetMapping("/active")
    public ResponseEntity<List<StockReservationResponse>> getActiveReservations() {
        List<StockReservation> reservations = reservationService.getActiveReservations();
        return ResponseEntity.ok(
            reservations.stream()
                .map(mapper::toStockReservationResponse)
                .collect(Collectors.toList())
        );
    }

    /**
     * Release reservation
     */
    @PostMapping("/{id}/release")
    public ResponseEntity<Void> releaseReservation(@PathVariable String id) {
        log.info("Releasing reservation: {}", id);
        reservationService.releaseReservation(id);
        return ResponseEntity.ok().build();
    }

    /**
     * Fulfill reservation (convert to sale/order)
     */
    @PostMapping("/{id}/fulfill")
    public ResponseEntity<Void> fulfillReservation(@PathVariable String id) {
        log.info("Fulfilling reservation: {}", id);
        reservationService.fulfillReservation(id);
        return ResponseEntity.ok().build();
    }

    /**
     * Cancel reservation
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelReservation(
        @PathVariable String id,
        @RequestParam String reason
    ) {
        log.info("Cancelling reservation: {} - Reason: {}", id, reason);
        reservationService.cancelReservation(id, reason);
        return ResponseEntity.ok().build();
    }

    /**
     * Extend reservation expiry
     */
    @PostMapping("/{id}/extend")
    public ResponseEntity<StockReservationResponse> extendReservation(
        @PathVariable String id,
        @RequestParam Integer additionalDays
    ) {
        log.info("Extending reservation {} by {} days", id, additionalDays);
        StockReservation extended = reservationService.extendReservation(id, additionalDays);
        return ResponseEntity.ok(mapper.toStockReservationResponse(extended));
    }

    /**
     * Get total reserved quantity for a product
     */
    @GetMapping("/product/{productId}/total-reserved")
    public ResponseEntity<Integer> getTotalReservedQuantity(@PathVariable String productId) {
        Integer total = reservationService.getTotalReservedQuantity(productId);
        return ResponseEntity.ok(total);
    }
}
