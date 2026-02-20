package com.ultron.backend.service.catalog;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;

/**
 * Normalizes Excel/CSV headers for consistent attribute keys
 * Handles: snake_case conversion, special char removal, unit aliases
 */
@Service
@Slf4j
public class HeaderNormalizer {

    // Unit aliases for normalization
    private static final Map<String, String> UNIT_ALIASES = Map.ofEntries(
            Map.entry("mm", "millimeter"),
            Map.entry("millimeter", "millimeter"),
            Map.entry("millimeters", "millimeter"),
            Map.entry("inch", "inch"),
            Map.entry("inches", "inch"),
            Map.entry("in", "inch"),
            Map.entry("cm", "centimeter"),
            Map.entry("centimeter", "centimeter"),
            Map.entry("m", "meter"),
            Map.entry("meter", "meter"),
            Map.entry("kg", "kilogram"),
            Map.entry("kilogram", "kilogram"),
            Map.entry("g", "gram"),
            Map.entry("gram", "gram"),
            Map.entry("lb", "pound"),
            Map.entry("pound", "pound"),
            Map.entry("pn", "pressure_nominal"),
            Map.entry("pressure nominal", "pressure_nominal")
    );

    // Common synonyms for normalization
    private static final Map<String, List<String>> SYNONYMS = Map.of(
            "size", List.of("dimension", "dia", "diameter"),
            "material", List.of("mat", "mtl"),
            "quantity", List.of("qty", "count"),
            "weight", List.of("wt", "mass"),
            "length", List.of("len", "l"),
            "width", List.of("w"),
            "height", List.of("h", "ht")
    );

    /**
     * Normalize a header to snake_case attribute key
     */
    public String normalize(String header) {
        if (header == null || header.trim().isEmpty()) {
            return "unnamed_column_" + UUID.randomUUID().toString().substring(0, 8);
        }

        String normalized = header.trim()
                .toLowerCase()
                // Remove special characters except spaces and hyphens
                .replaceAll("[^a-z0-9\\s-]", "")
                // Replace multiple spaces/hyphens with single space
                .replaceAll("[\\s-]+", " ")
                // Trim
                .trim()
                // Convert spaces to underscores (snake_case)
                .replace(" ", "_");

        // Handle unit aliases (e.g., "size_mm" -> "size_millimeter")
        normalized = normalizeUnits(normalized);

        // Handle common synonyms
        normalized = normalizeSynonyms(normalized);

        return normalized;
    }

    /**
     * Normalize unit aliases in the key
     */
    private String normalizeUnits(String key) {
        for (Map.Entry<String, String> entry : UNIT_ALIASES.entrySet()) {
            String alias = entry.getKey();
            String canonical = entry.getValue();

            // Replace unit suffix (e.g., "size_mm" -> "size_millimeter")
            if (key.endsWith("_" + alias)) {
                key = key.substring(0, key.length() - alias.length() - 1) + "_" + canonical;
            }

            // Replace unit prefix (e.g., "mm_size" -> "millimeter_size")
            if (key.startsWith(alias + "_")) {
                key = canonical + key.substring(alias.length());
            }
        }

        return key;
    }

    /**
     * Normalize common synonyms
     */
    private String normalizeSynonyms(String key) {
        for (Map.Entry<String, List<String>> entry : SYNONYMS.entrySet()) {
            String canonical = entry.getKey();
            List<String> synonyms = entry.getValue();

            for (String synonym : synonyms) {
                // Exact match
                if (key.equals(synonym)) {
                    return canonical;
                }

                // Suffix match (e.g., "pipe_dia" -> "pipe_size")
                if (key.endsWith("_" + synonym)) {
                    return key.substring(0, key.length() - synonym.length() - 1) + "_" + canonical;
                }

                // Prefix match (e.g., "dia_pipe" -> "size_pipe")
                if (key.startsWith(synonym + "_")) {
                    return canonical + key.substring(synonym.length());
                }
            }
        }

        return key;
    }

    /**
     * Create search tokens from a value
     * Normalizes for search: lowercase, unit aliases, synonyms
     */
    public List<String> createSearchTokens(String value) {
        if (value == null || value.trim().isEmpty()) {
            return Collections.emptyList();
        }

        Set<String> tokens = new HashSet<>();

        // Original tokens (lowercase, split by non-alphanumeric)
        String[] words = value.toLowerCase().split("[^a-z0-9]+");
        tokens.addAll(Arrays.asList(words));

        // Add tokens without hyphens (e.g., "pn-16" -> "pn16")
        String noHyphens = value.toLowerCase().replaceAll("-", "");
        if (!noHyphens.equals(value.toLowerCase())) {
            tokens.add(noHyphens);
        }

        // Add tokens with unit aliases
        for (Map.Entry<String, String> entry : UNIT_ALIASES.entrySet()) {
            String alias = entry.getKey();
            String canonical = entry.getValue();

            if (value.toLowerCase().contains(alias)) {
                String replaced = value.toLowerCase().replace(alias, canonical);
                tokens.add(replaced);
            }
        }

        return new ArrayList<>(tokens);
    }

    /**
     * Normalize a search query
     */
    public String normalizeSearchQuery(String query) {
        if (query == null || query.trim().isEmpty()) {
            return "";
        }

        String normalized = query.trim().toLowerCase();

        // Remove hyphens for flexible matching
        normalized = normalized.replace("-", " ");

        // Normalize units
        for (Map.Entry<String, String> entry : UNIT_ALIASES.entrySet()) {
            normalized = normalized.replace(entry.getKey(), entry.getValue());
        }

        return normalized;
    }

    /**
     * Check if a key represents a likely identifier field
     */
    public boolean isIdentifierField(String key) {
        String lower = key.toLowerCase();
        return lower.contains("id") ||
               lower.contains("sku") ||
               lower.contains("code") ||
               lower.contains("number") ||
               lower.equals("product_id") ||
               lower.equals("item_code");
    }

    /**
     * Check if a key represents a likely display name field
     */
    public boolean isDisplayNameField(String key) {
        String lower = key.toLowerCase();
        return lower.equals("name") ||
               lower.equals("product_name") ||
               lower.equals("productname") ||
               lower.equals("item_name") ||
               lower.equals("itemname") ||
               lower.equals("title") ||
               lower.equals("description") ||
               lower.equals("product_description") ||
               lower.equals("productdescription");
    }

    /**
     * Check if a key represents a category field
     */
    public boolean isCategoryField(String key) {
        String lower = key.toLowerCase();
        return lower.equals("category") ||
               lower.equals("type") ||
               lower.equals("product_type") ||
               lower.equals("product_category");
    }
}
