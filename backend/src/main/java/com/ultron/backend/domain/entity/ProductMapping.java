package com.ultron.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Links DynamicProduct (catalog) to structured Product (inventory)
 * Enables inventory tracking for catalog items uploaded via Excel
 */
@Document(collection = "product_mappings")
@CompoundIndexes({
    @CompoundIndex(name = "tenant_dynamic_idx", def = "{'tenantId': 1, 'dynamicProductId': 1}", unique = true),
    @CompoundIndex(name = "tenant_structured_idx", def = "{'tenantId': 1, 'structuredProductId': 1}"),
    @CompoundIndex(name = "tenant_enabled_idx", def = "{'tenantId': 1, 'inventoryTrackingEnabled': 1}")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductMapping {

    @Id
    private String id;

    // Multi-tenancy
    @Indexed
    private String tenantId;

    // Link catalog to structured product
    @Indexed
    private String dynamicProductId;  // Reference to DynamicProduct.id

    @Indexed
    private String structuredProductId;  // Reference to Product.id

    // Configuration
    private boolean autoSyncEnabled;  // Auto-sync price/description changes
    private boolean inventoryTrackingEnabled;  // Enable stock tracking

    /**
     * Field mapping from DynamicProduct attributes to Product fields
     * Example: {"UnitPrice": "basePrice", "ProductName": "productName"}
     */
    private Map<String, String> attributeMapping;

    // Sync tracking
    private SyncStatus syncStatus;
    private LocalDateTime lastSyncedAt;
    private String lastSyncError;

    // Audit fields
    private LocalDateTime createdAt;
    private String createdBy;
    private String createdByName;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
    private String lastModifiedByName;

    /**
     * Sync status enum
     */
    public enum SyncStatus {
        IN_SYNC,        // Both products have same data
        OUT_OF_SYNC,    // Changes detected, needs sync
        SYNC_FAILED,    // Last sync attempt failed
        NEVER_SYNCED    // Created but never synced
    }
}
