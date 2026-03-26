package com.ultron.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import java.math.BigDecimal;
import java.util.Map;

/**
 * Request to enable inventory tracking for a catalog product
 * Creates a new structured Product from DynamicProduct
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnableInventoryRequest {

    // Required inventory fields
    @NotBlank(message = "SKU is required")
    private String sku;

    @NotBlank(message = "Warehouse ID is required")
    private String warehouseId;

    @NotNull(message = "Initial stock quantity is required")
    @Min(value = 0, message = "Initial stock cannot be negative")
    private Integer initialStock;

    // Optional inventory configuration
    private Integer minStockLevel;
    private Integer maxStockLevel;
    private Integer reorderLevel;

    // Pricing (can be extracted from catalog or provided)
    private BigDecimal basePrice;
    private BigDecimal listPrice;
    private String currency = "INR";

    // Tax configuration
    private BigDecimal taxRate;
    private String taxType = "GST";

    // Sync configuration
    private boolean autoSyncEnabled = true;

    /**
     * Field mapping from DynamicProduct attributes to Product fields
     * If null, system will use default mapping
     */
    private Map<String, String> attributeMapping;

    /**
     * Notes/remarks for the initial stock entry
     */
    private String notes;
}
