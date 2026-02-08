package com.ultron.backend.service.catalog;

import com.ultron.backend.domain.entity.DynamicProduct.AttributeType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Automatically detects attribute value types without hardcoding
 * Supports: STRING, NUMBER, BOOLEAN, RANGE, DATE
 */
@Service
@Slf4j
public class AttributeTypeDetector {

    // Patterns for type detection
    private static final Pattern NUMBER_PATTERN = Pattern.compile("^-?\\d+(\\.\\d+)?$");
    private static final Pattern RANGE_PATTERN = Pattern.compile("^(\\d+(\\.\\d+)?)\\s*-\\s*(\\d+(\\.\\d+)?)$");
    private static final Pattern BOOLEAN_PATTERN = Pattern.compile("^(true|false|yes|no|y|n|1|0)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern DATE_PATTERN = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}$|^\\d{2}/\\d{2}/\\d{4}$");
    private static final Pattern UNIT_PATTERN = Pattern.compile("^(\\d+(\\.\\d+)?)\\s*(mm|cm|m|km|inch|ft|kg|g|lb)$", Pattern.CASE_INSENSITIVE);

    /**
     * Detect the type of a value
     */
    public TypeDetectionResult detectType(String value) {
        if (value == null || value.trim().isEmpty()) {
            return TypeDetectionResult.builder()
                    .type(AttributeType.UNKNOWN)
                    .build();
        }

        String trimmed = value.trim();

        // Check for boolean
        if (BOOLEAN_PATTERN.matcher(trimmed).matches()) {
            return TypeDetectionResult.builder()
                    .type(AttributeType.BOOLEAN)
                    .booleanValue(parseBoolean(trimmed))
                    .build();
        }

        // Check for range (e.g., "15-25", "10.5 - 20.3")
        Matcher rangeMatcher = RANGE_PATTERN.matcher(trimmed);
        if (rangeMatcher.matches()) {
            return TypeDetectionResult.builder()
                    .type(AttributeType.RANGE)
                    .rangeMin(Double.parseDouble(rangeMatcher.group(1)))
                    .rangeMax(Double.parseDouble(rangeMatcher.group(3)))
                    .build();
        }

        // Check for number with unit (e.g., "25mm", "100 kg")
        Matcher unitMatcher = UNIT_PATTERN.matcher(trimmed);
        if (unitMatcher.matches()) {
            return TypeDetectionResult.builder()
                    .type(AttributeType.NUMBER)
                    .numericValue(Double.parseDouble(unitMatcher.group(1)))
                    .unit(unitMatcher.group(3).toLowerCase())
                    .build();
        }

        // Check for pure number
        if (NUMBER_PATTERN.matcher(trimmed).matches()) {
            return TypeDetectionResult.builder()
                    .type(AttributeType.NUMBER)
                    .numericValue(Double.parseDouble(trimmed))
                    .build();
        }

        // Check for date
        if (DATE_PATTERN.matcher(trimmed).matches()) {
            return TypeDetectionResult.builder()
                    .type(AttributeType.DATE)
                    .build();
        }

        // Default to string
        return TypeDetectionResult.builder()
                .type(AttributeType.STRING)
                .build();
    }

    /**
     * Parse boolean from various formats
     */
    private boolean parseBoolean(String value) {
        String lower = value.toLowerCase().trim();
        return "true".equals(lower) || "yes".equals(lower) || "y".equals(lower) || "1".equals(lower);
    }

    /**
     * Extract unit from value if present
     */
    public String extractUnit(String value) {
        if (value == null) return null;

        Matcher matcher = UNIT_PATTERN.matcher(value.trim());
        if (matcher.matches()) {
            return matcher.group(3).toLowerCase();
        }
        return null;
    }

    /**
     * Extract numeric value from string with unit
     */
    public Double extractNumericValue(String value) {
        if (value == null) return null;

        Matcher matcher = UNIT_PATTERN.matcher(value.trim());
        if (matcher.matches()) {
            return Double.parseDouble(matcher.group(1));
        }

        Matcher numberMatcher = NUMBER_PATTERN.matcher(value.trim());
        if (numberMatcher.matches()) {
            return Double.parseDouble(value.trim());
        }

        return null;
    }

    /**
     * Result of type detection
     */
    @lombok.Data
    @lombok.Builder
    public static class TypeDetectionResult {
        private AttributeType type;
        private Double numericValue;
        private Double rangeMin;
        private Double rangeMax;
        private Boolean booleanValue;
        private String unit;
    }
}
