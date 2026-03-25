package com.ultron.backend.service.inventory;

import com.ultron.backend.domain.entity.Warehouse;
import com.ultron.backend.exception.BadRequestException;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.WarehouseRepository;
import com.ultron.backend.service.BaseTenantService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service for warehouse management operations
 */
@Slf4j
@Service
public class WarehouseService extends BaseTenantService {

    private final WarehouseRepository warehouseRepository;
    private final WarehouseIdGeneratorService idGenerator;

    public WarehouseService(
        WarehouseRepository warehouseRepository,
        WarehouseIdGeneratorService idGenerator
    ) {
        this.warehouseRepository = warehouseRepository;
        this.idGenerator = idGenerator;
    }

    /**
     * Create a new warehouse
     */
    @Transactional
    public Warehouse createWarehouse(Warehouse warehouse) {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();
        

        // Validate
        if (warehouse.getCode() != null &&
            warehouseRepository.existsByTenantIdAndCode(tenantId, warehouse.getCode())) {
            throw new BadRequestException("Warehouse code already exists: " + warehouse.getCode());
        }

        // Generate code if not provided
        if (warehouse.getCode() == null || warehouse.getCode().isEmpty()) {
            warehouse.setCode(idGenerator.generateWarehouseCode());
        }

        // Set tenant and audit fields
        warehouse.setTenantId(tenantId);
        warehouse.setCreatedAt(LocalDateTime.now());
        warehouse.setCreatedBy(userId);

        // If this is set as default, unset other defaults
        if (Boolean.TRUE.equals(warehouse.getIsDefault())) {
            unsetDefaultWarehouse(tenantId);
        }

        // Ensure at least one warehouse is default
        if (warehouseRepository.countByTenantId(tenantId) == 0) {
            warehouse.setIsDefault(true);
        }

        log.info("Creating warehouse: {} for tenant: {}", warehouse.getCode(), tenantId);
        return warehouseRepository.save(warehouse);
    }

    /**
     * Get warehouse by ID
     */
    public Warehouse getWarehouseById(String id) {
        String tenantId = getCurrentTenantId();
        return warehouseRepository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found: " + id));
    }

    /**
     * Get all warehouses for tenant
     */
    public List<Warehouse> getAllWarehouses() {
        String tenantId = getCurrentTenantId();
        return warehouseRepository.findByTenantId(tenantId);
    }

    /**
     * Get all warehouses (paginated)
     */
    public Page<Warehouse> getAllWarehouses(Pageable pageable) {
        String tenantId = getCurrentTenantId();
        return warehouseRepository.findByTenantId(tenantId, pageable);
    }

    /**
     * Get active warehouses only
     */
    public List<Warehouse> getActiveWarehouses() {
        String tenantId = getCurrentTenantId();
        return warehouseRepository.findByTenantIdAndIsActiveTrue(tenantId);
    }

    /**
     * Get default warehouse
     */
    public Warehouse getDefaultWarehouse() {
        String tenantId = getCurrentTenantId();
        return warehouseRepository.findByTenantIdAndIsDefaultTrue(tenantId)
            .orElseGet(() -> {
                // If no default, get first active warehouse
                List<Warehouse> warehouses = warehouseRepository.findByTenantIdAndIsActiveTrue(tenantId);
                if (!warehouses.isEmpty()) {
                    return warehouses.get(0);
                }
                throw new ResourceNotFoundException("No warehouse found for tenant");
            });
    }

    /**
     * Update warehouse
     */
    @Transactional
    public Warehouse updateWarehouse(String id, Warehouse updates) {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();
        

        Warehouse existing = getWarehouseById(id);

        // Update fields
        if (updates.getName() != null) {
            existing.setName(updates.getName());
        }
        if (updates.getType() != null) {
            existing.setType(updates.getType());
        }
        if (updates.getAddress() != null) {
            existing.setAddress(updates.getAddress());
        }
        if (updates.getManagerId() != null) {
            existing.setManagerId(updates.getManagerId());
            existing.setManagerName(updates.getManagerName());
        }
        if (updates.getIsActive() != null) {
            existing.setIsActive(updates.getIsActive());
        }
        if (updates.getIsDefault() != null && Boolean.TRUE.equals(updates.getIsDefault())) {
            unsetDefaultWarehouse(tenantId);
            existing.setIsDefault(true);
        }
        if (updates.getLocations() != null) {
            existing.setLocations(updates.getLocations());
        }

        existing.setLastModifiedAt(LocalDateTime.now());
        existing.setLastModifiedBy(userId);

        log.info("Updating warehouse: {} for tenant: {}", id, tenantId);
        return warehouseRepository.save(existing);
    }

    /**
     * Delete warehouse (soft delete by marking inactive)
     */
    @Transactional
    public void deleteWarehouse(String id) {
        String tenantId = getCurrentTenantId();
        Warehouse warehouse = getWarehouseById(id);

        if (Boolean.TRUE.equals(warehouse.getIsDefault())) {
            throw new BadRequestException("Cannot delete default warehouse. Please set another warehouse as default first.");
        }

        warehouse.setIsActive(false);
        warehouse.setLastModifiedAt(LocalDateTime.now());
        warehouse.setLastModifiedBy(getCurrentUserId());

        log.info("Deleting warehouse: {} for tenant: {}", id, tenantId);
        warehouseRepository.save(warehouse);
    }

    /**
     * Add location to warehouse
     */
    @Transactional
    public Warehouse addLocation(String warehouseId, Warehouse.StorageLocation location) {
        Warehouse warehouse = getWarehouseById(warehouseId);

        // Generate location ID if not provided
        if (location.getId() == null || location.getId().isEmpty()) {
            location.setId(UUID.randomUUID().toString());
        }

        // Ensure location is active by default
        if (location.getIsActive() == null) {
            location.setIsActive(true);
        }

        warehouse.getLocations().add(location);
        warehouse.setLastModifiedAt(LocalDateTime.now());
        warehouse.setLastModifiedBy(getCurrentUserId());

        log.info("Adding location {} to warehouse: {}", location.getCode(), warehouseId);
        return warehouseRepository.save(warehouse);
    }

    /**
     * Remove location from warehouse
     */
    @Transactional
    public Warehouse removeLocation(String warehouseId, String locationId) {
        Warehouse warehouse = getWarehouseById(warehouseId);

        boolean removed = warehouse.getLocations().removeIf(loc -> loc.getId().equals(locationId));

        if (!removed) {
            throw new ResourceNotFoundException("Location not found: " + locationId);
        }

        warehouse.setLastModifiedAt(LocalDateTime.now());
        warehouse.setLastModifiedBy(getCurrentUserId());

        log.info("Removing location {} from warehouse: {}", locationId, warehouseId);
        return warehouseRepository.save(warehouse);
    }

    /**
     * Get warehouse by code
     */
    public Warehouse getWarehouseByCode(String code) {
        String tenantId = getCurrentTenantId();
        return warehouseRepository.findByTenantIdAndCode(tenantId, code)
            .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with code: " + code));
    }

    /**
     * Unset default flag on all warehouses
     */
    private void unsetDefaultWarehouse(String tenantId) {
        warehouseRepository.findByTenantIdAndIsDefaultTrue(tenantId)
            .ifPresent(warehouse -> {
                warehouse.setIsDefault(false);
                warehouseRepository.save(warehouse);
            });
    }

    /**
     * Get warehouse count
     */
    public long getWarehouseCount() {
        String tenantId = getCurrentTenantId();
        return warehouseRepository.countByTenantId(tenantId);
    }

    /**
     * Get active warehouse count
     */
    public long getActiveWarehouseCount() {
        String tenantId = getCurrentTenantId();
        return warehouseRepository.countByTenantIdAndIsActiveTrue(tenantId);
    }
}
