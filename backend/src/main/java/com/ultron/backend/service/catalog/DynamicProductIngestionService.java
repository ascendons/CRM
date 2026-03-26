package com.ultron.backend.service.catalog;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import com.ultron.backend.domain.entity.DynamicProduct;
import com.ultron.backend.domain.entity.DynamicProduct.ProductAttribute;
import com.ultron.backend.domain.entity.DynamicProduct.SourceMetadata;
import com.ultron.backend.domain.entity.Warehouse;
import com.ultron.backend.dto.request.EnableInventoryRequest;
import com.ultron.backend.exception.BadRequestException;
import com.ultron.backend.repository.DynamicProductRepository;
import com.ultron.backend.service.BaseTenantService;
import com.ultron.backend.service.ProductMappingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Core ingestion service for schema-less product catalog
 * Pipeline: Upload → Parse → Normalize → Detect Types → Store → Index
 * MULTI-TENANT AWARE: All products are associated with current tenant
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DynamicProductIngestionService extends BaseTenantService {

    private final DynamicProductRepository repository;
    private final HeaderNormalizer headerNormalizer;
    private final AttributeTypeDetector typeDetector;
    private final DynamicProductIdGeneratorService idGeneratorService;
    private final ProductMappingService productMappingService;
    private final com.ultron.backend.service.inventory.WarehouseService warehouseService;

    /**
     * Preview headers from an uploaded file (no ingestion)
     * Returns list of {normalizedKey, originalKey} pairs
     */
    public List<Map<String, String>> previewHeaders(MultipartFile file) {
        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new BadRequestException("Invalid file");
        }

        try {
            Map<Integer, HeaderInfo> headerMap;
            if (filename.endsWith(".csv")) {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()));
                     CSVReader csvReader = new CSVReader(reader)) {
                    String[] headers = csvReader.readNext();
                    if (headers == null || headers.length == 0) {
                        throw new BadRequestException("CSV file has no headers");
                    }
                    headerMap = normalizeHeaders(headers);
                }
            } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
                try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
                    Sheet sheet = workbook.getSheetAt(0);
                    Row headerRow = sheet.getRow(0);
                    if (headerRow == null) {
                        throw new BadRequestException("Excel file has no headers");
                    }
                    headerMap = normalizeExcelHeaders(headerRow);
                }
            } else {
                throw new BadRequestException("Unsupported file format. Use CSV or Excel.");
            }

            return headerMap.values().stream()
                    .map(h -> Map.of("key", h.normalizedKey, "originalKey", h.originalKey))
                    .collect(Collectors.toList());
        } catch (IOException | CsvValidationException e) {
            throw new RuntimeException("Failed to parse file headers: " + e.getMessage(), e);
        }
    }

    /**
     * Ingest products from uploaded Excel/CSV file
     * MULTI-TENANT SAFE: All products are associated with current tenant
     * @param searchableFields set of normalized keys that should be searchable; if null, all fields are searchable
     */
    public IngestionResult ingestProducts(MultipartFile file, String userId, Set<String> searchableFields) {
        String tenantId = getCurrentTenantId();
        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new BadRequestException("Invalid file");
        }

        log.info("[Tenant: {}] Starting ingestion for file: {}, searchableFields: {}", tenantId, filename, searchableFields);

        List<DynamicProduct> products;
        try {
            if (filename.endsWith(".csv")) {
                products = parseAndIngestCsv(file, userId, tenantId, filename, searchableFields);
            } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
                products = parseAndIngestExcel(file, userId, tenantId, filename, searchableFields);
            } else {
                throw new BadRequestException("Unsupported file format. Use CSV or Excel.");
            }
        } catch (IOException | CsvValidationException e) {
            throw new RuntimeException("Failed to parse file: " + e.getMessage(), e);
        }

        // Save all products
        List<DynamicProduct> saved = repository.saveAll(products);

        log.info("Ingestion complete: {} products saved from {}", saved.size(), filename);

        // Check if inventory columns are present and auto-enable inventory
        int inventoryEnabled = 0;
        if (!products.isEmpty()) {
            boolean hasInventoryColumns = detectInventoryColumns(products.get(0).getAttributes());

            if (hasInventoryColumns) {
                log.info("[Tenant: {}] Detected inventory columns, auto-enabling inventory for {} products", tenantId, saved.size());

                for (DynamicProduct product : saved) {
                    try {
                        EnableInventoryRequest request = buildInventoryRequest(product);
                        productMappingService.enableInventory(product.getId(), request);
                        inventoryEnabled++;
                    } catch (Exception e) {
                        log.error("Failed to auto-enable inventory for product {}: {}", product.getId(), e.getMessage());
                        // Continue with next product
                    }
                }

                log.info("[Tenant: {}] Auto-enabled inventory for {}/{} products", tenantId, inventoryEnabled, saved.size());
            }
        }

        return IngestionResult.builder()
                .totalProducts(saved.size())
                .fileName(filename)
                .uploadedBy(userId)
                .uploadedAt(LocalDateTime.now())
                .productIds(saved.stream().map(DynamicProduct::getProductId).collect(Collectors.toList()))
                .inventoryEnabled(inventoryEnabled)
                .autoInventoryEnabled(inventoryEnabled > 0)
                .build();
    }

    /**
     * Parse and ingest from CSV
     */
    private List<DynamicProduct> parseAndIngestCsv(MultipartFile file, String userId, String tenantId, String filename, Set<String> searchableFields)
            throws IOException, CsvValidationException {

        List<DynamicProduct> products = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()));
             CSVReader csvReader = new CSVReader(reader)) {

            // Read headers
            String[] headers = csvReader.readNext();
            if (headers == null || headers.length == 0) {
                throw new BadRequestException("CSV file has no headers");
            }

            // Normalize headers
            Map<Integer, HeaderInfo> headerMap = normalizeHeaders(headers);

            // Read rows
            String[] row;
            int rowNumber = 1;
            while ((row = csvReader.readNext()) != null) {
                rowNumber++;
                DynamicProduct product = createProductFromRow(row, headerMap, filename, "CSV", rowNumber, userId, tenantId, searchableFields);
                if (product != null) {
                    products.add(product);
                }
            }
        }

        return products;
    }

    /**
     * Parse and ingest from Excel
     */
    private List<DynamicProduct> parseAndIngestExcel(MultipartFile file, String userId, String tenantId, String filename, Set<String> searchableFields)
            throws IOException {

        List<DynamicProduct> products = new ArrayList<>();

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            // Read headers from first row
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                throw new BadRequestException("Excel file has no headers");
            }

            Map<Integer, HeaderInfo> headerMap = normalizeExcelHeaders(headerRow);

            // Read data rows
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                DynamicProduct product = createProductFromExcelRow(row, headerMap, filename, "XLSX", i + 1, userId, tenantId, searchableFields);
                if (product != null) {
                    products.add(product);
                }
            }
        }

        return products;
    }

    /**
     * Normalize CSV headers
     */
    private Map<Integer, HeaderInfo> normalizeHeaders(String[] headers) {
        Map<Integer, HeaderInfo> map = new HashMap<>();

        for (int i = 0; i < headers.length; i++) {
            String original = headers[i];
            String normalized = headerNormalizer.normalize(original);

            map.put(i, new HeaderInfo(original, normalized));
        }

        return map;
    }

    /**
     * Normalize Excel headers
     */
    private Map<Integer, HeaderInfo> normalizeExcelHeaders(Row headerRow) {
        Map<Integer, HeaderInfo> map = new HashMap<>();

        for (Cell cell : headerRow) {
            String original = cell.getStringCellValue();
            String normalized = headerNormalizer.normalize(original);

            map.put(cell.getColumnIndex(), new HeaderInfo(original, normalized));
        }

        return map;
    }

    /**
     * Create DynamicProduct from CSV row
     * @param searchableFields set of normalized keys that should be searchable; if null, all fields are searchable
     */
    private DynamicProduct createProductFromRow(String[] row, Map<Integer, HeaderInfo> headerMap,
                                               String filename, String fileType, int rowNumber, String userId, String tenantId,
                                               Set<String> searchableFields) {

        if (row.length == 0) return null;

        List<ProductAttribute> attributes = new ArrayList<>();
        StringBuilder rawText = new StringBuilder();
        StringBuilder searchTokensBuilder = new StringBuilder();
        List<String> normalizedTokens = new ArrayList<>();

        String displayName = null;
        String category = null;

        // Process each column
        for (int i = 0; i < row.length; i++) {
            String value = row[i];
            if (value == null || value.trim().isEmpty()) continue;

            HeaderInfo headerInfo = headerMap.get(i);
            if (headerInfo == null) continue;

            String normalizedKey = headerInfo.normalizedKey;
            String originalKey = headerInfo.originalKey;

            // Detect type
            AttributeTypeDetector.TypeDetectionResult typeResult = typeDetector.detectType(value);

            // Determine if this field is searchable
            boolean isSearchable = (searchableFields == null) || searchableFields.contains(normalizedKey);

            // Create attribute
            ProductAttribute attr = ProductAttribute.builder()
                    .key(normalizedKey)
                    .originalKey(originalKey)
                    .value(value.trim())
                    .type(typeResult.getType())
                    .numericValue(typeResult.getNumericValue())
                    .rangeMin(typeResult.getRangeMin())
                    .rangeMax(typeResult.getRangeMax())
                    .booleanValue(typeResult.getBooleanValue())
                    .unit(typeResult.getUnit())
                    .searchable(isSearchable)
                    .build();

            attributes.add(attr);

            // Build raw text
            rawText.append(originalKey).append("=").append(value).append("; ");

            // Only add searchable fields to search tokens
            if (isSearchable) {
                searchTokensBuilder.append(value).append(" ");
                searchTokensBuilder.append(normalizedKey).append(" ");
                normalizedTokens.addAll(headerNormalizer.createSearchTokens(value));
            }

            // Extract display name
            if (displayName == null && headerNormalizer.isDisplayNameField(normalizedKey)) {
                displayName = value.trim();
            }

            // Extract category
            if (category == null && headerNormalizer.isCategoryField(normalizedKey)) {
                category = value.trim();
            }
        }

        // Fallback display name (first non-empty value)
        if (displayName == null && !attributes.isEmpty()) {
            displayName = attributes.get(0).getValue();
        }

        // Build source metadata
        Map<String, String> headersMap = headerMap.values().stream()
                .collect(Collectors.toMap(h -> h.normalizedKey, h -> h.originalKey));

        SourceMetadata source = SourceMetadata.builder()
                .fileName(filename)
                .fileType(fileType)
                .rowNumber(rowNumber)
                .uploadedAt(LocalDateTime.now())
                .uploadedBy(userId)
                .headers(headersMap)
                .build();

        // Generate product ID
        String productId = idGeneratorService.generateProductId();

        return DynamicProduct.builder()
                .productId(productId)
                .tenantId(tenantId)
                .displayName(displayName)
                .category(category)
                .attributes(attributes)
                .rawText(rawText.toString())
                .searchTokens(searchTokensBuilder.toString().toLowerCase())
                .normalizedTokens(normalizedTokens)
                .source(source)
                .createdAt(LocalDateTime.now())
                .createdBy(userId)
                .isDeleted(false)
                .build();
    }

    /**
     * Create DynamicProduct from Excel row
     */
    private DynamicProduct createProductFromExcelRow(Row row, Map<Integer, HeaderInfo> headerMap,
                                                    String filename, String fileType, int rowNumber, String userId, String tenantId,
                                                    Set<String> searchableFields) {

        // Convert Excel row to string array
        String[] rowData = new String[headerMap.size()];
        boolean isEmpty = true;

        for (int i = 0; i < headerMap.size(); i++) {
            Cell cell = row.getCell(i, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
            if (cell != null) {
                rowData[i] = getCellValueAsString(cell);
                isEmpty = false;
            } else {
                rowData[i] = "";
            }
        }

        if (isEmpty) return null;

        return createProductFromRow(rowData, headerMap, filename, fileType, rowNumber, userId, tenantId, searchableFields);
    }

    /**
     * Get Excel cell value as string
     */
    private String getCellValueAsString(Cell cell) {
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().toString();
                }
                // Format number without scientific notation
                double numValue = cell.getNumericCellValue();
                if (numValue == (long) numValue) {
                    return String.valueOf((long) numValue);
                }
                return String.valueOf(numValue);
            case BOOLEAN: return String.valueOf(cell.getBooleanCellValue());
            case FORMULA: return cell.getCellFormula();
            default: return "";
        }
    }

    /**
     * Detect if inventory-related columns are present
     */
    private boolean detectInventoryColumns(List<ProductAttribute> attributes) {
        Set<String> attributeKeys = attributes.stream()
                .map(ProductAttribute::getKey)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        // Check for any inventory-related column
        return attributeKeys.contains("sku") ||
                attributeKeys.contains("initialstock") ||
                attributeKeys.contains("warehouse") ||
                attributeKeys.contains("minstocklevel") ||
                attributeKeys.contains("reorderlevel");
    }

    /**
     * Build EnableInventoryRequest from product attributes
     */
    private EnableInventoryRequest buildInventoryRequest(DynamicProduct product) {
        Map<String, String> attrMap = product.getAttributes().stream()
                .collect(Collectors.toMap(
                        attr -> attr.getKey().toLowerCase(),
                        ProductAttribute::getValue,
                        (v1, v2) -> v1
                ));

        // Extract values from attributes
        String sku = attrMap.getOrDefault("sku", "");
        String warehouseCode = attrMap.getOrDefault("warehouse", "");
        Integer initialStock = parseIntOrDefault(attrMap.get("initialstock"), 0);
        Integer minStockLevel = parseIntOrDefault(attrMap.get("minstocklevel"), 10);
        Integer reorderLevel = parseIntOrDefault(attrMap.get("reorderlevel"), 20);

        // Auto-generate SKU if not provided
        if (sku == null || sku.trim().isEmpty()) {
            String prefix = product.getDisplayName().substring(0, Math.min(3, product.getDisplayName().length()))
                    .toUpperCase().replaceAll("[^A-Z]", "X");
            sku = prefix + "-" + System.currentTimeMillis() + "-" + product.getId().substring(0, 3);
        }

        // Get default warehouse if not specified
        String warehouseId;
        if (warehouseCode == null || warehouseCode.trim().isEmpty()) {
            Warehouse defaultWarehouse = warehouseService.getDefaultWarehouse();
            warehouseId = defaultWarehouse.getId();
            log.debug("Using default warehouse: {}", defaultWarehouse.getName());
        } else {
            // Try to find warehouse by code or name
            warehouseId = findWarehouseByCodeOrName(warehouseCode);
        }

        // Extract price from attributes
        BigDecimal basePrice = extractPrice(product.getAttributes());
        log.info("Building inventory request for product {}: basePrice={}, sku={}, warehouse={}",
                product.getId(), basePrice, sku, warehouseId);

        return EnableInventoryRequest.builder()
                .sku(sku)
                .warehouseId(warehouseId)
                .initialStock(initialStock)
                .minStockLevel(minStockLevel)
                .reorderLevel(reorderLevel)
                .basePrice(basePrice)
                .currency("INR")
                .taxRate(BigDecimal.valueOf(18.0))
                .taxType("GST")
                .autoSyncEnabled(true)
                .build();
    }

    /**
     * Parse integer or return default
     */
    private Integer parseIntOrDefault(String value, Integer defaultValue) {
        if (value == null || value.trim().isEmpty()) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    /**
     * Extract price from attributes
     */
    private BigDecimal extractPrice(List<ProductAttribute> attributes) {
        for (ProductAttribute attr : attributes) {
            String key = attr.getKey().toLowerCase();
            if ("UnitPrice".equalsIgnoreCase(key)) {
                try {
                    String value = attr.getValue();
                    log.debug("Found price attribute: key={}, value={}", attr.getKey(), value);

                    // Clean the value - remove currency symbols, commas, spaces
                    String cleaned = value.replaceAll("[^0-9.]", "").trim();

                    if (cleaned.isEmpty()) {
                        log.warn("Price value is empty after cleaning: original={}", value);
                        continue;
                    }

                    BigDecimal price = new BigDecimal(cleaned);
                    log.info("Successfully extracted price: {} from attribute key: {}", price, attr.getKey());
                    return price;
                } catch (Exception e) {
                    log.warn("Failed to parse price from attribute key={}, value={}: {}",
                            attr.getKey(), attr.getValue(), e.getMessage());
                }
            }
        }

        log.warn("No valid price found in attributes, defaulting to 0");
        return BigDecimal.ZERO;
    }

    /**
     * Find warehouse by code or name
     */
    private String findWarehouseByCodeOrName(String codeOrName) {
        try {
            // Try to find by code first
            List<com.ultron.backend.domain.entity.Warehouse> warehouses = warehouseService.getAllWarehouses();
            Optional<com.ultron.backend.domain.entity.Warehouse> warehouse = warehouses.stream()
                    .filter(w -> w.getCode().equalsIgnoreCase(codeOrName) ||
                            w.getName().equalsIgnoreCase(codeOrName))
                    .findFirst();

            if (warehouse.isPresent()) {
                return warehouse.get().getId();
            }

            // Fallback to default warehouse
            log.warn("Warehouse not found by code/name: {}, using default", codeOrName);
            return warehouseService.getDefaultWarehouse().getId();
        } catch (Exception e) {
            log.error("Error finding warehouse: {}", e.getMessage());
            return warehouseService.getDefaultWarehouse().getId();
        }
    }

    /**
     * Header information
     */
    private static class HeaderInfo {
        String originalKey;
        String normalizedKey;

        HeaderInfo(String originalKey, String normalizedKey) {
            this.originalKey = originalKey;
            this.normalizedKey = normalizedKey;
        }
    }

    /**
     * Ingestion result
     */
    @lombok.Data
    @lombok.Builder
    public static class IngestionResult {
        private int totalProducts;
        private String fileName;
        private String uploadedBy;
        private LocalDateTime uploadedAt;
        private List<String> productIds;
        private int inventoryEnabled;
        private boolean autoInventoryEnabled;
    }
}
