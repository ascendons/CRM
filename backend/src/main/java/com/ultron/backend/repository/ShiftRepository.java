package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Shift;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShiftRepository extends MongoRepository<Shift, String> {

    /**
     * Find shift by unique shiftId and tenantId (SFT-YYYY-MM-XXXXX)
     * MULTI-TENANT SAFE
     */
    Optional<Shift> findByShiftIdAndTenantId(String shiftId, String tenantId);

    /**
     * Find all shifts for a specific tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<Shift> findByTenantIdAndIsDeletedFalse(String tenantId);

    /**
     * Find all active shifts for a specific tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<Shift> findByTenantIdAndIsActiveTrueAndIsDeletedFalse(String tenantId);

    /**
     * Find default shift for a specific tenant
     * MULTI-TENANT SAFE
     */
    Optional<Shift> findByTenantIdAndIsDefaultTrueAndIsDeletedFalse(String tenantId);

    /**
     * Find shifts by name within tenant (for search/autocomplete)
     * MULTI-TENANT SAFE
     */
    List<Shift> findByNameContainingIgnoreCaseAndTenantIdAndIsDeletedFalse(String name, String tenantId);

    /**
     * Find shift by code within tenant
     * MULTI-TENANT SAFE
     */
    Optional<Shift> findByCodeAndTenantIdAndIsDeletedFalse(String code, String tenantId);

    /**
     * Count total shifts for tenant
     * MULTI-TENANT SAFE
     */
    long countByTenantIdAndIsDeletedFalse(String tenantId);

    /**
     * Count active shifts for tenant
     * MULTI-TENANT SAFE
     */
    long countByTenantIdAndIsActiveTrueAndIsDeletedFalse(String tenantId);

    // ===== DANGEROUS METHODS - DO NOT USE IN BUSINESS LOGIC =====

    /**
     * ⚠️ ADMIN ONLY - Find shift by shiftId across ALL tenants
     * Use with EXTREME caution
     */
    Optional<Shift> findByShiftId(String shiftId);

    /**
     * ⚠️ ADMIN ONLY - Get latest shift across ALL tenants
     * Use ONLY for global ID generation
     */
    Optional<Shift> findFirstByOrderByCreatedAtDesc();
}
