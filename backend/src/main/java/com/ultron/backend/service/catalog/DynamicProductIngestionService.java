package com.ultron.backend.service.catalog;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import com.ultron.backend.domain.entity.DynamicProduct;
import com.ultron.backend.domain.entity.DynamicProduct.ProductAttribute;
import com.ultron.backend.domain.entity.DynamicProduct.SourceMetadata;
import com.ultron.backend.exception.BadRequestException;
import com.ultron.backend.repository.DynamicProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Core ingestion service for schema-less product catalog
 * Pipeline: Upload → Parse → Normalize → Detect Types → Store → Index
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DynamicProductIngestionService {

    private final DynamicProductRepository repository;
    private final HeaderNormalizer headerNormalizer;
    private final AttributeTypeDetector typeDetector;
    private final DynamicProductIdGeneratorService idGeneratorService;

    /**
     * Ingest products from uploaded Excel/CSV file
     */
    public IngestionResult ingestProducts(MultipartFile file, String userId) {
        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new BadRequestException("Invalid file");
        }

        log.info("Starting ingestion for file: {}", filename);

        List<DynamicProduct> products;
        try {
            if (filename.endsWith(".csv")) {
                products = parseAndIngestCsv(file, userId, filename);
            } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
                products = parseAndIngestExcel(file, userId, filename);
            } else {
                throw new BadRequestException("Unsupported file format. Use CSV or Excel.");
            }
        } catch (IOException | CsvValidationException e) {
            throw new RuntimeException("Failed to parse file: " + e.getMessage(), e);
        }

        // Save all products
        List<DynamicProduct> saved = repository.saveAll(products);

        log.info("Ingestion complete: {} products saved from {}", saved.size(), filename);

        return IngestionResult.builder()
                .totalProducts(saved.size())
                .fileName(filename)
                .uploadedBy(userId)
                .uploadedAt(LocalDateTime.now())
                .productIds(saved.stream().map(DynamicProduct::getProductId).collect(Collectors.toList()))
                .build();
    }

    /**
     * Parse and ingest from CSV
     */
    private List<DynamicProduct> parseAndIngestCsv(MultipartFile file, String userId, String filename)
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
            int rowNumber = 1; // Excel row numbers start at 1 (0 is header)
            while ((row = csvReader.readNext()) != null) {
                rowNumber++;
                DynamicProduct product = createProductFromRow(row, headerMap, filename, "CSV", rowNumber, userId);
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
    private List<DynamicProduct> parseAndIngestExcel(MultipartFile file, String userId, String filename)
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

                DynamicProduct product = createProductFromExcelRow(row, headerMap, filename, "XLSX", i + 1, userId);
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
     */
    private DynamicProduct createProductFromRow(String[] row, Map<Integer, HeaderInfo> headerMap,
                                               String filename, String fileType, int rowNumber, String userId) {

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
                    .searchable(true)
                    .build();

            attributes.add(attr);

            // Build raw text
            rawText.append(originalKey).append("=").append(value).append("; ");

            // Build search tokens
            searchTokensBuilder.append(value).append(" ");
            searchTokensBuilder.append(normalizedKey).append(" ");
            normalizedTokens.addAll(headerNormalizer.createSearchTokens(value));

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
                                                    String filename, String fileType, int rowNumber, String userId) {

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

        return createProductFromRow(rowData, headerMap, filename, fileType, rowNumber, userId);
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
    }
}
