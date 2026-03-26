package com.ultron.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;

/**
 * Request to link a catalog product to an existing structured product
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LinkInventoryRequest {

    /**
     * ID of the existing structured product (Product.id)
     */
    @NotBlank(message = "Structured product ID is required")
    private String structuredProductId;

    /**
     * Enable auto-sync between catalog and product
     */
    private boolean autoSyncEnabled = true;

    /**
     * Enable inventory tracking for this catalog item
     */
    private boolean inventoryTrackingEnabled = true;

    /**
     * Optional field mapping for sync
     * Key: DynamicProduct attribute key
     * Value: Product field name
     * Example: {"UnitPrice": "basePrice", "ProductName": "productName"}
     */
    private Map<String, String> attributeMapping;
}
