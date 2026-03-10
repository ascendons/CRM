package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.OfficeLocation;
import com.ultron.backend.domain.enums.LocationType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OfficeLocationRepository extends MongoRepository<OfficeLocation, String> {

    /**
     * Find office location by unique locationId and tenantId (LOC-YYYY-MM-XXXXX)
     * Excludes soft-deleted records
     * MULTI-TENANT SAFE
     */
    Optional<OfficeLocation> findByLocationIdAndTenantIdAndIsDeletedFalse(String locationId, String tenantId);

    /**
     * Find all office locations for a specific tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<OfficeLocation> findByTenantIdAndIsDeletedFalse(String tenantId);

    /**
     * Find all active office locations for a specific tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<OfficeLocation> findByTenantIdAndIsActiveTrueAndIsDeletedFalse(String tenantId);

    /**
     * Find headquarters office location for a specific tenant
     * MULTI-TENANT SAFE
     */
    Optional<OfficeLocation> findByTenantIdAndIsHeadquartersTrueAndIsDeletedFalse(String tenantId);

    /**
     * Find office locations by type within tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<OfficeLocation> findByTenantIdAndTypeAndIsDeletedFalse(String tenantId, LocationType type);

    /**
     * Find office locations by name within tenant (for search/autocomplete)
     * MULTI-TENANT SAFE
     */
    List<OfficeLocation> findByNameContainingIgnoreCaseAndTenantIdAndIsDeletedFalse(String name, String tenantId);

    /**
     * Find office location by code within tenant
     * MULTI-TENANT SAFE
     */
    Optional<OfficeLocation> findByCodeAndTenantIdAndIsDeletedFalse(String code, String tenantId);

    /**
     * Find office locations by city within tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<OfficeLocation> findByCityAndTenantIdAndIsDeletedFalse(String city, String tenantId);

    /**
     * Find office locations by state within tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<OfficeLocation> findByStateAndTenantIdAndIsDeletedFalse(String state, String tenantId);

    /**
     * Count total office locations for tenant
     * MULTI-TENANT SAFE
     */
    long countByTenantIdAndIsDeletedFalse(String tenantId);

    /**
     * Count active office locations for tenant
     * MULTI-TENANT SAFE
     */
    long countByTenantIdAndIsActiveTrueAndIsDeletedFalse(String tenantId);

    // ===== DANGEROUS METHODS - DO NOT USE IN BUSINESS LOGIC =====

    /**
     * ⚠️ ADMIN ONLY - Find office location by locationId across ALL tenants
     * Use with EXTREME caution
     */
    Optional<OfficeLocation> findByLocationId(String locationId);

    /**
     * ⚠️ ADMIN ONLY - Get latest office location across ALL tenants
     * Use ONLY for global ID generation
     */
    Optional<OfficeLocation> findFirstByOrderByCreatedAtDesc();
}
