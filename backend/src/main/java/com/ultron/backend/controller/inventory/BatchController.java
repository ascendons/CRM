package com.ultron.backend.controller.inventory;

import com.ultron.backend.domain.entity.Batch;
import com.ultron.backend.dto.request.inventory.CreateBatchRequest;
import com.ultron.backend.dto.response.inventory.BatchResponse;
import com.ultron.backend.mapper.InventoryMapper;
import com.ultron.backend.service.inventory.BatchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

/**
 * REST Controller for batch/lot management
 */
@Slf4j
@RestController
@RequestMapping("/inventory/batches")
@RequiredArgsConstructor
public class BatchController {

    private final BatchService batchService;
    private final InventoryMapper mapper;

    /**
     * Create a new batch
     */
    @PostMapping
    public ResponseEntity<BatchResponse> createBatch(
        @Valid @RequestBody CreateBatchRequest request
    ) {
        log.info("Creating batch: {} for product: {}", request.getBatchNumber(), request.getProductId());
        Batch batch = mapper.toBatchEntity(request);
        Batch created = batchService.createBatch(batch);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toBatchResponse(created));
    }

    /**
     * Get batch by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<BatchResponse> getBatchById(@PathVariable String id) {
        Batch batch = batchService.getBatchById(id);
        return ResponseEntity.ok(mapper.toBatchResponse(batch));
    }

    /**
     * Get batches by product
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<BatchResponse>> getBatchesByProduct(@PathVariable String productId) {
        List<Batch> batches = batchService.getBatchesByProduct(productId);
        return ResponseEntity.ok(
            batches.stream()
                .map(mapper::toBatchResponse)
                .collect(Collectors.toList())
        );
    }

    /**
     * Get available batches by product (for FIFO/FEFO picking)
     */
    @GetMapping("/product/{productId}/available")
    public ResponseEntity<List<BatchResponse>> getAvailableBatchesByProduct(@PathVariable String productId) {
        List<Batch> batches = batchService.getAvailableBatchesByProduct(productId);
        return ResponseEntity.ok(
            batches.stream()
                .map(mapper::toBatchResponse)
                .collect(Collectors.toList())
        );
    }

    /**
     * Get batch by product and batch number
     */
    @GetMapping("/product/{productId}/number/{batchNumber}")
    public ResponseEntity<BatchResponse> getBatchByNumber(
        @PathVariable String productId,
        @PathVariable String batchNumber
    ) {
        Batch batch = batchService.getBatchByNumber(productId, batchNumber);
        return ResponseEntity.ok(mapper.toBatchResponse(batch));
    }

    /**
     * Update batch quantity
     */
    @PutMapping("/{batchId}/quantity")
    public ResponseEntity<BatchResponse> updateBatchQuantity(
        @PathVariable String batchId,
        @RequestParam Integer quantityChange,
        @RequestParam boolean increase
    ) {
        log.info("Updating batch {} quantity: {} {}", batchId,
            increase ? "+" : "-", quantityChange);

        Batch updated = batchService.updateBatchQuantity(batchId, quantityChange, increase);
        return ResponseEntity.ok(mapper.toBatchResponse(updated));
    }

    /**
     * Reserve batch quantity
     */
    @PostMapping("/{batchId}/reserve")
    public ResponseEntity<BatchResponse> reserveBatchQuantity(
        @PathVariable String batchId,
        @RequestParam Integer quantity
    ) {
        log.info("Reserving {} units from batch: {}", quantity, batchId);
        Batch updated = batchService.reserveBatchQuantity(batchId, quantity);
        return ResponseEntity.ok(mapper.toBatchResponse(updated));
    }

    /**
     * Release batch reservation
     */
    @PostMapping("/{batchId}/release")
    public ResponseEntity<BatchResponse> releaseBatchReservation(
        @PathVariable String batchId,
        @RequestParam Integer quantity
    ) {
        log.info("Releasing {} units from batch: {}", quantity, batchId);
        Batch updated = batchService.releaseBatchReservation(batchId, quantity);
        return ResponseEntity.ok(mapper.toBatchResponse(updated));
    }

    /**
     * Get batches expiring soon
     */
    @GetMapping("/expiring-soon")
    public ResponseEntity<List<BatchResponse>> getBatchesExpiringSoon(
        @RequestParam(defaultValue = "30") Integer daysThreshold
    ) {
        List<Batch> batches = batchService.getBatchesExpiringSoon(daysThreshold);
        return ResponseEntity.ok(
            batches.stream()
                .map(mapper::toBatchResponse)
                .collect(Collectors.toList())
        );
    }

    /**
     * Get expired batches
     */
    @GetMapping("/expired")
    public ResponseEntity<List<BatchResponse>> getExpiredBatches() {
        List<Batch> batches = batchService.getExpiredBatches();
        return ResponseEntity.ok(
            batches.stream()
                .map(mapper::toBatchResponse)
                .collect(Collectors.toList())
        );
    }

    /**
     * Mark batch as expired
     */
    @PostMapping("/{batchId}/mark-expired")
    public ResponseEntity<BatchResponse> markBatchAsExpired(@PathVariable String batchId) {
        log.info("Marking batch {} as expired", batchId);
        Batch updated = batchService.markBatchAsExpired(batchId);
        return ResponseEntity.ok(mapper.toBatchResponse(updated));
    }

    /**
     * Quarantine batch
     */
    @PostMapping("/{batchId}/quarantine")
    public ResponseEntity<BatchResponse> quarantineBatch(
        @PathVariable String batchId,
        @RequestParam String reason
    ) {
        log.info("Quarantining batch {}: {}", batchId, reason);
        Batch updated = batchService.quarantineBatch(batchId, reason);
        return ResponseEntity.ok(mapper.toBatchResponse(updated));
    }

    /**
     * Release batch from quarantine
     */
    @PostMapping("/{batchId}/release-quarantine")
    public ResponseEntity<BatchResponse> releaseBatchFromQuarantine(@PathVariable String batchId) {
        log.info("Releasing batch {} from quarantine", batchId);
        Batch updated = batchService.releaseBatchFromQuarantine(batchId);
        return ResponseEntity.ok(mapper.toBatchResponse(updated));
    }

    /**
     * Recall batch
     */
    @PostMapping("/{batchId}/recall")
    public ResponseEntity<BatchResponse> recallBatch(
        @PathVariable String batchId,
        @RequestParam String reason
    ) {
        log.warn("RECALLING batch {}: {}", batchId, reason);
        Batch updated = batchService.recallBatch(batchId, reason);
        return ResponseEntity.ok(mapper.toBatchResponse(updated));
    }

    /**
     * Get recalled batches
     */
    @GetMapping("/recalled")
    public ResponseEntity<List<BatchResponse>> getRecalledBatches() {
        List<Batch> batches = batchService.getRecalledBatches();
        return ResponseEntity.ok(
            batches.stream()
                .map(mapper::toBatchResponse)
                .collect(Collectors.toList())
        );
    }

    /**
     * Get batch count by product
     */
    @GetMapping("/product/{productId}/count")
    public ResponseEntity<Long> getBatchCountByProduct(@PathVariable String productId) {
        return ResponseEntity.ok(batchService.getBatchCountByProduct(productId));
    }

    /**
     * Get active batch count
     */
    @GetMapping("/count/active")
    public ResponseEntity<Long> getActiveBatchCount() {
        return ResponseEntity.ok(batchService.getActiveBatchCount());
    }
}
