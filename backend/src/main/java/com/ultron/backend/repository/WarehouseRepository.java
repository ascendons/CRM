package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Warehouse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Warehouse entity
 */
@Repository
public interface WarehouseRepository extends MongoRepository<Warehouse, String> {

    // Find by tenant
    List<Warehouse> findByTenantId(String tenantId);

    Page<Warehouse> findByTenantId(String tenantId, Pageable pageable);

    // Find active warehouses
    List<Warehouse> findByTenantIdAndIsActiveTrue(String tenantId);

    // Find by code
    Optional<Warehouse> findByTenantIdAndCode(String tenantId, String code);

    // Check if code exists
    boolean existsByTenantIdAndCode(String tenantId, String code);

    // Find default warehouse
    Optional<Warehouse> findByTenantIdAndIsDefaultTrue(String tenantId);

    // Find by ID and tenant (for security)
    Optional<Warehouse> findByIdAndTenantId(String id, String tenantId);

    // Find by manager
    List<Warehouse> findByTenantIdAndManagerId(String tenantId, String managerId);

    // Find by type
    List<Warehouse> findByTenantIdAndType(String tenantId, String type);

    // Count warehouses
    long countByTenantId(String tenantId);

    long countByTenantIdAndIsActiveTrue(String tenantId);
}
