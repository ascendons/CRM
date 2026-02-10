package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.ProductStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "products")
@CompoundIndexes({
    @CompoundIndex(name = "tenant_deleted_idx", def = "{'tenantId': 1, 'isDeleted': 1}"),
    @CompoundIndex(name = "tenant_category_deleted_idx", def = "{'tenantId': 1, 'category': 1, 'isDeleted': 1}"),
    @CompoundIndex(name = "tenant_status_deleted_idx", def = "{'tenantId': 1, 'status': 1, 'isDeleted': 1}"),
    @CompoundIndex(name = "tenant_active_deleted_idx", def = "{'tenantId': 1, 'isActive': 1, 'isDeleted': 1}"),
    @CompoundIndex(name = "tenant_productId_idx", def = "{'tenantId': 1, 'productId': 1}", unique = true),
    @CompoundIndex(name = "tenant_sku_idx", def = "{'tenantId': 1, 'sku': 1}", unique = true)
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    @Id
    private String id;  // MongoDB ObjectId

    @Indexed
    private String productId;  // Business ID: PRD-YYYY-MM-XXXXX (unique per tenant via compound index)

    // Multi-tenancy
    @Indexed
    private String tenantId;

    // Basic Information
    @Indexed
    private String sku;  // Stock Keeping Unit (unique per tenant via compound index)
    private String productName;
    private String description;

    // Pricing
    private BigDecimal basePrice;  // Unit price before tax
    private BigDecimal listPrice;  // MSRP
    private BigDecimal discount;   // Default discount percentage
    private String currency;  // Default: "INR"
    private String unit;  // "piece", "kg", "meter", "box", etc.

    // Tax Configuration
    private BigDecimal taxRate;  // Percentage (e.g., 18.00 for 18% GST)
    private String taxType;  // "GST", "VAT", "NONE"

    // Categorization
    private String category;  // "Hardware", "Software", "Services"
    private String subcategory;
    private List<String> tags;  // ["pipe", "construction", "steel"]

    // Inventory (optional for Phase 1)
    private Integer stockQuantity;
    private Integer minStockLevel;
    private Integer maxStockLevel;
    private Integer reorderLevel;

    // Status
    private ProductStatus status;  // ACTIVE, DISCONTINUED, OUT_OF_STOCK
    private Boolean isActive;
    private Boolean isDeleted;

    // Audit Fields
    private LocalDateTime createdAt;
    private String createdBy;
    private String createdByName;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
    private String lastModifiedByName;
}
