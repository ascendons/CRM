package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.ProductMapping;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for ProductMapping entity
 */
@Repository
public interface ProductMappingRepository extends MongoRepository<ProductMapping, String> {

    // Find by tenant
    List<ProductMapping> findByTenantId(String tenantId);

    // Find by dynamic product (catalog)
    Optional<ProductMapping> findByTenantIdAndDynamicProductId(String tenantId, String dynamicProductId);

    // Find by structured product (inventory)
    List<ProductMapping> findByTenantIdAndStructuredProductId(String tenantId, String structuredProductId);

    // Check if mapping exists
    boolean existsByTenantIdAndDynamicProductId(String tenantId, String dynamicProductId);

    boolean existsByTenantIdAndStructuredProductId(String tenantId, String structuredProductId);

    // Find all with inventory tracking enabled
    List<ProductMapping> findByTenantIdAndInventoryTrackingEnabled(String tenantId, boolean enabled);

    // Find by sync status
    List<ProductMapping> findByTenantIdAndSyncStatus(
        String tenantId,
        ProductMapping.SyncStatus syncStatus
    );

    // Find mappings needing sync (out of sync or failed)
    List<ProductMapping> findByTenantIdAndSyncStatusIn(
        String tenantId,
        List<ProductMapping.SyncStatus> statuses
    );

    // Delete by dynamic product
    void deleteByTenantIdAndDynamicProductId(String tenantId, String dynamicProductId);

    // Count mappings
    long countByTenantId(String tenantId);

    long countByTenantIdAndInventoryTrackingEnabled(String tenantId, boolean enabled);
}
