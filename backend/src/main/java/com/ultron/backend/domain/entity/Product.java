package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.ProductStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    @Id
    private String id;  // MongoDB ObjectId

    @Indexed(unique = true)
    private String productId;  // Business ID: PRD-YYYY-MM-XXXXX

    // Basic Information
    @Indexed(unique = true)
    private String sku;  // Stock Keeping Unit (unique)
    private String productName;
    private String description;

    // Pricing
    private BigDecimal basePrice;  // Unit price before tax
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
