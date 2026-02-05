package com.ultron.backend.dto.response;

import com.ultron.backend.domain.enums.ProductStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private String id;
    private String productId;
    private String sku;
    private String productName;
    private String description;

    private BigDecimal basePrice;
    private BigDecimal listPrice;
    private BigDecimal discount;
    private String currency;
    private String unit;

    private BigDecimal taxRate;
    private String taxType;

    private String category;
    private String subcategory;
    private List<String> tags;

    private Integer stockQuantity;
    private Integer minStockLevel;
    private Integer maxStockLevel;
    private Integer reorderLevel;

    private ProductStatus status;
    private Boolean isActive;

    private LocalDateTime createdAt;
    private String createdBy;
    private String createdByName;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
    private String lastModifiedByName;
}
