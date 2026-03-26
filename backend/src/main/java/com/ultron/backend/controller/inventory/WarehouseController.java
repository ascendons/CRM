package com.ultron.backend.controller.inventory;

import com.ultron.backend.domain.entity.Warehouse;
import com.ultron.backend.dto.request.inventory.AddStorageLocationRequest;
import com.ultron.backend.dto.request.inventory.CreateWarehouseRequest;
import com.ultron.backend.dto.request.inventory.UpdateWarehouseRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.inventory.WarehouseResponse;
import com.ultron.backend.mapper.InventoryMapper;
import com.ultron.backend.service.inventory.WarehouseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

/**
 * REST Controller for warehouse management
 */
@Slf4j
@RestController
@RequestMapping("/inventory/warehouses")
@RequiredArgsConstructor
public class WarehouseController {

    private final WarehouseService warehouseService;
    private final InventoryMapper mapper;

    /**
     * Create a new warehouse
     */
    @PostMapping
    public ResponseEntity<ApiResponse<WarehouseResponse>> createWarehouse(
        @Valid @RequestBody CreateWarehouseRequest request
    ) {
        log.info("Creating warehouse: {}", request.getName());
        Warehouse warehouse = mapper.toWarehouseEntity(request);
        Warehouse created = warehouseService.createWarehouse(warehouse);
        return ResponseEntity.status(HttpStatus.CREATED).body(
            ApiResponse.success("Warehouse created successfully", mapper.toWarehouseResponse(created))
        );
    }

    /**
     * Get warehouse by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WarehouseResponse>> getWarehouseById(@PathVariable String id) {
        Warehouse warehouse = warehouseService.getWarehouseById(id);
        return ResponseEntity.ok(
            ApiResponse.success("Warehouse retrieved successfully", mapper.toWarehouseResponse(warehouse))
        );
    }

    /**
     * Get all warehouses (paginated)
     */
    @GetMapping
    public ResponseEntity<Page<WarehouseResponse>> getAllWarehouses(Pageable pageable) {
        Page<Warehouse> warehouses = warehouseService.getAllWarehouses(pageable);
        return ResponseEntity.ok(warehouses.map(mapper::toWarehouseResponse));
    }

    /**
     * Get all warehouses (list)
     */
    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<WarehouseResponse>>> getAllWarehousesList() {
        List<Warehouse> warehouses = warehouseService.getAllWarehouses();
        List<WarehouseResponse> response = warehouses.stream()
            .map(mapper::toWarehouseResponse)
            .collect(Collectors.toList());
        return ResponseEntity.ok(
            ApiResponse.success("Warehouses retrieved successfully", response)
        );
    }

    /**
     * Get active warehouses
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<WarehouseResponse>>> getActiveWarehouses() {
        List<Warehouse> warehouses = warehouseService.getActiveWarehouses();
        List<WarehouseResponse> response = warehouses.stream()
            .map(mapper::toWarehouseResponse)
            .collect(Collectors.toList());
        return ResponseEntity.ok(
            ApiResponse.success("Active warehouses retrieved successfully", response)
        );
    }

    /**
     * Get default warehouse
     */
    @GetMapping("/default")
    public ResponseEntity<ApiResponse<WarehouseResponse>> getDefaultWarehouse() {
        Warehouse warehouse = warehouseService.getDefaultWarehouse();
        return ResponseEntity.ok(
            ApiResponse.success("Default warehouse retrieved successfully", mapper.toWarehouseResponse(warehouse))
        );
    }

    /**
     * Update warehouse
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WarehouseResponse>> updateWarehouse(
        @PathVariable String id,
        @Valid @RequestBody UpdateWarehouseRequest request
    ) {
        log.info("Updating warehouse: {}", id);
        Warehouse updates = mapper.toWarehouseEntity(request);
        Warehouse updated = warehouseService.updateWarehouse(id, updates);
        return ResponseEntity.ok(
            ApiResponse.success("Warehouse updated successfully", mapper.toWarehouseResponse(updated))
        );
    }

    /**
     * Delete warehouse (soft delete)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWarehouse(@PathVariable String id) {
        log.info("Deleting warehouse: {}", id);
        warehouseService.deleteWarehouse(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Add storage location to warehouse
     */
    @PostMapping("/{warehouseId}/locations")
    public ResponseEntity<ApiResponse<WarehouseResponse>> addLocation(
        @PathVariable String warehouseId,
        @Valid @RequestBody AddStorageLocationRequest request
    ) {
        log.info("Adding location to warehouse: {}", warehouseId);
        Warehouse.StorageLocation location = mapper.toStorageLocationEntity(request);
        Warehouse updated = warehouseService.addLocation(warehouseId, location);
        return ResponseEntity.ok(
            ApiResponse.success("Storage location added successfully", mapper.toWarehouseResponse(updated))
        );
    }

    /**
     * Remove storage location from warehouse
     */
    @DeleteMapping("/{warehouseId}/locations/{locationId}")
    public ResponseEntity<ApiResponse<WarehouseResponse>> removeLocation(
        @PathVariable String warehouseId,
        @PathVariable String locationId
    ) {
        log.info("Removing location {} from warehouse: {}", locationId, warehouseId);
        Warehouse updated = warehouseService.removeLocation(warehouseId, locationId);
        return ResponseEntity.ok(
            ApiResponse.success("Storage location removed successfully", mapper.toWarehouseResponse(updated))
        );
    }

    /**
     * Get warehouse count
     */
    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> getWarehouseCount() {
        return ResponseEntity.ok(
            ApiResponse.success("Warehouse count retrieved successfully", warehouseService.getWarehouseCount())
        );
    }
}
