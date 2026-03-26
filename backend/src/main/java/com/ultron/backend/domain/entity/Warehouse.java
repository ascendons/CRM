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
import java.util.ArrayList;
import java.util.List;

/**
 * Warehouse entity for inventory management.
 * Represents a physical location where inventory is stored.
 */
@Document(collection = "inventory_warehouses")
@CompoundIndexes({
    @CompoundIndex(name = "tenant_code_idx", def = "{'tenantId': 1, 'code': 1}", unique = true),
    @CompoundIndex(name = "tenant_active_idx", def = "{'tenantId': 1, 'isActive': 1}")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Warehouse {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    // Identification
    private String code;                // WH-001, WH-MUMBAI
    private String name;                // "Main Warehouse - Mumbai"
    private String type;                // MAIN, BRANCH, TRANSIT, VIRTUAL

    // Location
    private Address address;

    // Manager
    private String managerId;           // User ID
    private String managerName;

    // Settings
    @Builder.Default
    private Boolean isActive = true;
    @Builder.Default
    private Boolean isDefault = false;  // Default warehouse for tenant

    // Storage Locations (Bins, Racks, Aisles)
    @Builder.Default
    private List<StorageLocation> locations = new ArrayList<>();

    // Audit
    private LocalDateTime createdAt;
    private String createdBy;
    private String createdByName;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
    private String lastModifiedByName;

    /**
     * Address information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Address {
        private String line1;
        private String line2;
        private String city;
        private String state;
        private String country;
        private String postalCode;
        private String landmark;
    }

    /**
     * Storage location within warehouse
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StorageLocation {
        private String id;              // Auto-generated
        private String code;            // A-01-05 (Zone-Aisle-Bin)
        private String name;            // "Zone A - Aisle 01 - Bin 05"
        private String type;            // BIN, PALLET, SHELF, FLOOR, RACK
        private Integer capacity;       // Max units that can be stored
        @Builder.Default
        private Boolean isActive = true;
        private List<String> allowedCategories;  // Restrict by product category
    }
}
