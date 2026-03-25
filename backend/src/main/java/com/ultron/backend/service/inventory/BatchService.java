package com.ultron.backend.service.inventory;

import com.ultron.backend.domain.entity.Batch;
import com.ultron.backend.exception.BadRequestException;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.multitenancy.TenantContext;
import com.ultron.backend.repository.BatchRepository;
import com.ultron.backend.service.BaseTenantService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for batch/lot tracking
 * Used for products that require traceability (pharma, FMCG, food, etc.)
 */
@Slf4j
@Service
public class BatchService extends BaseTenantService {

    private final BatchRepository batchRepository;

    public BatchService(BatchRepository batchRepository) {
        this.batchRepository = batchRepository;
    }

    /**
     * Create new batch
     */
    @Transactional
    public Batch createBatch(Batch batch) {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();
        

        // Validate unique batch number per product
        if (batchRepository.existsByTenantIdAndProductIdAndBatchNumber(
            tenantId, batch.getProductId(), batch.getBatchNumber())) {
            throw new BadRequestException("Batch number already exists for this product: " + batch.getBatchNumber());
        }

        // Set tenant and audit fields
        batch.setTenantId(tenantId);
        batch.setCreatedAt(LocalDateTime.now());
        batch.setCreatedBy(userId);

        // Set default status
        if (batch.getStatus() == null) {
            batch.setStatus(Batch.BatchStatus.ACTIVE);
        }

        // Initialize quantities
        if (batch.getQuantity() == null) {
            batch.setQuantity(0);
        }
        if (batch.getQuantityReserved() == null) {
            batch.setQuantityReserved(0);
        }
        batch.setQuantityAvailable(batch.getQuantity() - batch.getQuantityReserved());

        // Store original quantity
        if (batch.getOriginalQuantity() == null) {
            batch.setOriginalQuantity(batch.getQuantity());
        }

        // Calculate shelf life if both dates are present
        if (batch.getManufacturingDate() != null && batch.getExpiryDate() != null) {
            batch.setShelfLifeDays(
                (int) java.time.temporal.ChronoUnit.DAYS.between(
                    batch.getManufacturingDate(), batch.getExpiryDate()
                )
            );
        }

        log.info("Creating batch: {} for product: {}", batch.getBatchNumber(), batch.getProductId());
        return batchRepository.save(batch);
    }

    /**
     * Get batch by ID
     */
    public Batch getBatchById(String id) {
        String tenantId = getCurrentTenantId();
        return batchRepository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Batch not found: " + id));
    }

    /**
     * Get batches by product
     */
    public List<Batch> getBatchesByProduct(String productId) {
        String tenantId = getCurrentTenantId();
        return batchRepository.findByTenantIdAndProductId(tenantId, productId);
    }

    /**
     * Get available batches by product (for FIFO/FEFO picking)
     */
    public List<Batch> getAvailableBatchesByProduct(String productId) {
        String tenantId = getCurrentTenantId();
        return batchRepository.findAvailableBatchesByProduct(tenantId, productId);
    }

    /**
     * Get batch by product and batch number
     */
    public Batch getBatchByNumber(String productId, String batchNumber) {
        String tenantId = getCurrentTenantId();
        return batchRepository.findByTenantIdAndProductIdAndBatchNumber(tenantId, productId, batchNumber)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Batch not found: " + batchNumber + " for product: " + productId));
    }

    /**
     * Update batch quantity (when stock moves in/out)
     */
    @Transactional
    public Batch updateBatchQuantity(String batchId, Integer quantityChange, boolean increase) {
        Batch batch = getBatchById(batchId);

        int newQuantity = increase
            ? batch.getQuantity() + quantityChange
            : batch.getQuantity() - quantityChange;

        if (newQuantity < 0) {
            throw new BadRequestException("Insufficient quantity in batch: " + batch.getBatchNumber());
        }

        batch.setQuantity(newQuantity);
        batch.setQuantityAvailable(newQuantity - batch.getQuantityReserved());

        // Mark as depleted if quantity is zero
        if (newQuantity == 0) {
            batch.setStatus(Batch.BatchStatus.DEPLETED);
        }

        batch.setLastModifiedAt(LocalDateTime.now());
        batch.setLastModifiedBy(getCurrentUserId());

        return batchRepository.save(batch);
    }

    /**
     * Reserve batch quantity
     */
    @Transactional
    public Batch reserveBatchQuantity(String batchId, Integer quantity) {
        Batch batch = getBatchById(batchId);

        if (batch.getQuantityAvailable() < quantity) {
            throw new BadRequestException("Insufficient available quantity in batch: " + batch.getBatchNumber());
        }

        batch.setQuantityReserved(batch.getQuantityReserved() + quantity);
        batch.setQuantityAvailable(batch.getQuantity() - batch.getQuantityReserved());

        batch.setLastModifiedAt(LocalDateTime.now());
        batch.setLastModifiedBy(getCurrentUserId());

        return batchRepository.save(batch);
    }

    /**
     * Release batch reservation
     */
    @Transactional
    public Batch releaseBatchReservation(String batchId, Integer quantity) {
        Batch batch = getBatchById(batchId);

        if (batch.getQuantityReserved() < quantity) {
            throw new BadRequestException("Cannot release more than reserved quantity");
        }

        batch.setQuantityReserved(batch.getQuantityReserved() - quantity);
        batch.setQuantityAvailable(batch.getQuantity() - batch.getQuantityReserved());

        batch.setLastModifiedAt(LocalDateTime.now());
        batch.setLastModifiedBy(getCurrentUserId());

        return batchRepository.save(batch);
    }

    /**
     * Get batches expiring soon (within specified days)
     */
    public List<Batch> getBatchesExpiringSoon(Integer daysThreshold) {
        String tenantId = getCurrentTenantId();
        LocalDate today = LocalDate.now();
        LocalDate futureDate = today.plusDays(daysThreshold);

        return batchRepository.findBatchesExpiringSoon(tenantId, today, futureDate);
    }

    /**
     * Get expired batches
     */
    public List<Batch> getExpiredBatches() {
        String tenantId = getCurrentTenantId();
        return batchRepository.findExpiredBatches(tenantId, LocalDate.now());
    }

    /**
     * Mark batch as expired
     */
    @Transactional
    public Batch markBatchAsExpired(String batchId) {
        Batch batch = getBatchById(batchId);

        batch.setStatus(Batch.BatchStatus.EXPIRED);
        batch.setLastModifiedAt(LocalDateTime.now());
        batch.setLastModifiedBy(getCurrentUserId());

        log.info("Marked batch {} as expired", batch.getBatchNumber());
        return batchRepository.save(batch);
    }

    /**
     * Mark batch as quarantined
     */
    @Transactional
    public Batch quarantineBatch(String batchId, String reason) {
        Batch batch = getBatchById(batchId);

        batch.setStatus(Batch.BatchStatus.QUARANTINE);
        batch.setQcStatus("QUARANTINE");
        batch.setQcNotes(reason);
        batch.setQcDate(LocalDate.now());
        batch.setQcBy(getCurrentUserId());
        batch.setLastModifiedAt(LocalDateTime.now());
        batch.setLastModifiedBy(getCurrentUserId());

        log.info("Quarantined batch {} - Reason: {}", batch.getBatchNumber(), reason);
        return batchRepository.save(batch);
    }

    /**
     * Release batch from quarantine
     */
    @Transactional
    public Batch releaseBatchFromQuarantine(String batchId) {
        Batch batch = getBatchById(batchId);

        if (batch.getStatus() != Batch.BatchStatus.QUARANTINE) {
            throw new BadRequestException("Batch is not in quarantine");
        }

        batch.setStatus(Batch.BatchStatus.ACTIVE);
        batch.setQcStatus("PASSED");
        batch.setLastModifiedAt(LocalDateTime.now());
        batch.setLastModifiedBy(getCurrentUserId());

        log.info("Released batch {} from quarantine", batch.getBatchNumber());
        return batchRepository.save(batch);
    }

    /**
     * Recall batch
     */
    @Transactional
    public Batch recallBatch(String batchId, String reason) {
        Batch batch = getBatchById(batchId);

        batch.setStatus(Batch.BatchStatus.RECALLED);
        batch.setIsRecalled(true);
        batch.setRecallDate(LocalDate.now());
        batch.setRecallReason(reason);
        batch.setRecallBy(getCurrentUserId());
        batch.setLastModifiedAt(LocalDateTime.now());
        batch.setLastModifiedBy(getCurrentUserId());

        log.warn("BATCH RECALL: {} - Reason: {}", batch.getBatchNumber(), reason);
        return batchRepository.save(batch);
    }

    /**
     * Get recalled batches
     */
    public List<Batch> getRecalledBatches() {
        String tenantId = getCurrentTenantId();
        return batchRepository.findByTenantIdAndIsRecalledTrue(tenantId);
    }

    /**
     * Auto-expire batches (scheduled job - runs daily at midnight)
     * Processes batches across ALL tenants in the system
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void autoExpireBatches() {
        log.info("Running auto-expire batches job");

        // Get expired batches across ALL tenants
        List<Batch> expiredBatches = batchRepository.findExpiredBatchesAllTenants(LocalDate.now());

        if (expiredBatches.isEmpty()) {
            log.info("No expired batches found");
            return;
        }

        log.info("Found {} expired batch(es) to process", expiredBatches.size());

        int expiredCount = 0;
        for (Batch batch : expiredBatches) {
            // Set tenant context for this batch
            TenantContext.setTenantId(batch.getTenantId());

            try {
                batch.setStatus(Batch.BatchStatus.EXPIRED);
                batch.setLastModifiedAt(LocalDateTime.now());
                batch.setLastModifiedBy("SYSTEM");
                batchRepository.save(batch);

                expiredCount++;

                log.info("Auto-expired batch {} for product {} (tenant: {})",
                    batch.getBatchNumber(), batch.getProductId(), batch.getTenantId());

            } catch (Exception e) {
                log.error("Failed to auto-expire batch {} (tenant: {}): {}",
                    batch.getBatchNumber(), batch.getTenantId(), e.getMessage());
            } finally {
                // Always clear tenant context after processing each batch
                TenantContext.clear();
            }
        }

        if (expiredCount > 0) {
            log.info("Successfully auto-expired {} batches", expiredCount);
        }
    }

    /**
     * Get batch count by product
     */
    public long getBatchCountByProduct(String productId) {
        String tenantId = getCurrentTenantId();
        return batchRepository.countByTenantIdAndProductId(tenantId, productId);
    }

    /**
     * Get active batch count
     */
    public long getActiveBatchCount() {
        String tenantId = getCurrentTenantId();
        return batchRepository.countByTenantIdAndStatus(tenantId, Batch.BatchStatus.ACTIVE);
    }
}
