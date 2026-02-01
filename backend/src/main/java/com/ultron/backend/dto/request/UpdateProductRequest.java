package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.ProductStatus;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProductRequest {

    @Size(min = 2, max = 200, message = "Product name must be between 2 and 200 characters")
    private String productName;

    @Size(max = 1000, message = "Description must be less than 1000 characters")
    private String description;

    @Positive(message = "Base price must be positive")
    @Digits(integer = 10, fraction = 2, message = "Base price must have at most 10 integer digits and 2 decimal places")
    private BigDecimal basePrice;

    @Size(max = 20, message = "Unit must be less than 20 characters")
    private String unit;

    @Min(value = 0, message = "Tax rate must be at least 0")
    @Max(value = 100, message = "Tax rate must be at most 100")
    @Digits(integer = 3, fraction = 2, message = "Tax rate must have at most 3 integer digits and 2 decimal places")
    private BigDecimal taxRate;

    @Pattern(regexp = "^(GST|VAT|NONE)$", message = "Tax type must be GST, VAT, or NONE")
    private String taxType;

    @Size(max = 100, message = "Category must be less than 100 characters")
    private String category;

    @Size(max = 100, message = "Subcategory must be less than 100 characters")
    private String subcategory;

    private List<String> tags;

    private ProductStatus status;

    // Inventory fields
    @Min(value = 0, message = "Stock quantity must be at least 0")
    private Integer stockQuantity;

    @Min(value = 0, message = "Minimum stock level must be at least 0")
    private Integer minStockLevel;

    @Min(value = 0, message = "Maximum stock level must be at least 0")
    private Integer maxStockLevel;
}
