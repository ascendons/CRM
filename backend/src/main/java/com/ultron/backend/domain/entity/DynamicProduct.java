package com.ultron.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Schema-less product entity that supports arbitrary attributes
 * Core principle: NO hardcoded product fields
 */
@Document(collection = "dynamic_products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DynamicProduct {

    @Id
    private String id;

    // Business ID for external reference
    @Indexed(unique = true)
    private String productId;

    // Multi-tenancy
    @Indexed
    private String tenantId;

    // Display name extracted from first meaningful column
    @TextIndexed(weight = 3)
    private String displayName;

    // Category/Type for high-level grouping (optional, extracted from file or header)
    @Indexed
    private String category;

    // ALL product attributes as key-value pairs
    // This allows ANY field from Excel without schema changes
    private List<ProductAttribute> attributes;

    // Raw CSV/Excel row for audit and debugging
    private String rawText;

    // Pre-computed search tokens for fast full-text search
    // Contains: display_name + all attribute values + normalized keys
    @TextIndexed(weight = 2)
    private String searchTokens;

    // Normalized search tokens (lowercase, synonym-replaced, unit-normalized)
    private List<String> normalizedTokens;

    // Source file metadata
    private SourceMetadata source;

    // Audit fields
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;

    private boolean isDeleted;
    private LocalDateTime deletedAt;

    /**
     * Represents a single product attribute (column from Excel)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductAttribute {
        // Normalized key (snake_case, trimmed)
        private String key;

        // Original header name from Excel
        private String originalKey;

        // Attribute value (stored as string, typed separately)
        private String value;

        // Detected type for smart filtering
        private AttributeType type;

        // For numeric values
        private Double numericValue;

        // For range values (e.g., "15-25")
        private Double rangeMin;
        private Double rangeMax;

        // For boolean values
        private Boolean booleanValue;

        // Unit if detected (mm, inch, kg, etc.)
        private String unit;

        // Searchable flag
        private boolean searchable = true;
    }

    /**
     * Attribute value types (auto-detected)
     */
    public enum AttributeType {
        STRING,
        NUMBER,
        BOOLEAN,
        RANGE,
        DATE,
        UNKNOWN
    }

    /**
     * Source file metadata
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SourceMetadata {
        private String fileName;
        private String fileType; // CSV, XLSX
        private int rowNumber; // Row number in original file
        private LocalDateTime uploadedAt;
        private String uploadedBy;
        private Map<String, String> headers; // Map of normalized_key -> original_key
    }
}
