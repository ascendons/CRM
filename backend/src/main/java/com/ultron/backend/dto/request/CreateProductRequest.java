package com.ultron.backend.dto.request;

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
public class CreateProductRequest {

    @NotBlank(message = "SKU is required")
    @Size(max = 50, message = "SKU must be less than 50 characters")
    @Pattern(regexp = "^[A-Z0-9-]+$", message = "SKU must contain only uppercase letters, numbers, and hyphens")
    private String sku;

    @NotBlank(message = "Product name is required")
    @Size(min = 2, max = 200, message = "Product name must be between 2 and 200 characters")
    private String productName;

    @Size(max = 1000, message = "Description must be less than 1000 characters")
    private String description;

    @NotNull(message = "Base price is required")
    @Positive(message = "Base price must be positive")
    @Digits(integer = 10, fraction = 2, message = "Base price must have at most 10 integer digits and 2 decimal places")
    private BigDecimal basePrice;

    @Digits(integer = 10, fraction = 2, message = "List price must have at most 10 integer digits and 2 decimal places")
    private BigDecimal listPrice;

    @Min(value = 0, message = "Discount must be at least 0")
    @Max(value = 100, message = "Discount must be at most 100")
    @Digits(integer = 3, fraction = 2, message = "Discount must have at most 3 integer digits and 2 decimal places")
    private BigDecimal discount;

    @Size(max = 10, message = "Currency code must be less than 10 characters")
    private String currency;  // Default: "INR"

    @NotBlank(message = "Unit is required")
    @Size(max = 20, message = "Unit must be less than 20 characters")
    private String unit;  // "piece", "kg", "meter", "box", etc.

    @NotNull(message = "Tax rate is required")
    @Min(value = 0, message = "Tax rate must be at least 0")
    @Max(value = 100, message = "Tax rate must be at most 100")
    @Digits(integer = 3, fraction = 2, message = "Tax rate must have at most 3 integer digits and 2 decimal places")
    private BigDecimal taxRate;

//    @NotBlank(message = "Tax type is required")
//    @Pattern(regexp = "^(GST|VAT|NONE)$", message = "Tax type must be GST, VAT, or NONE")
    private String taxType = "GST";

    @NotBlank(message = "Category is required")
    @Size(max = 100, message = "Category must be less than 100 characters")
    private String category;

    @Size(max = 100, message = "Subcategory must be less than 100 characters")
    private String subcategory;

    private List<String> tags;

    // Inventory fields (optional)
    @Min(value = 0, message = "Stock quantity must be at least 0")
    private Integer stockQuantity;

    @Min(value = 0, message = "Minimum stock level must be at least 0")
    private Integer minStockLevel;

    @Min(value = 0, message = "Maximum stock level must be at least 0")
    private Integer maxStockLevel;

    @Min(value = 0, message = "Reorder level must be at least 0")
    private Integer reorderLevel;
}
