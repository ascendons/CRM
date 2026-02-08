package com.ultron.backend.service;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import com.ultron.backend.domain.entity.Product;
import com.ultron.backend.domain.enums.ProductStatus;
import com.ultron.backend.dto.request.CreateProductRequest;
import com.ultron.backend.dto.response.ProductResponse;
import com.ultron.backend.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductImportService {

    private final ProductService productService;

    private static final String[] HEADERS = {
            "SKU", "Product Name", "Description", "Base Price", "List Price", "Discount",
            "Currency", "Unit", "Tax Rate", "Tax Type", "Category", "Subcategory",
            "Tags (comma separated)", "Stock Quantity", "Min Stock", "Max Stock", "Reorder Level", "Status"
    };

    public byte[] generateTemplate() {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Products");
            Row headerRow = sheet.createRow(0);

            // Create header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException e) {
            log.error("Failed to generate Excel template", e);
            throw new RuntimeException("Failed to generate template", e);
        }
    }

    public List<ProductResponse> importProducts(MultipartFile file, String userId) {
        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new BadRequestException("Invalid file");
        }

        List<CreateProductRequest> products;

        try {
            if (filename.endsWith(".csv")) {
                products = parseCsv(file);
            } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
                products = parseExcel(file);
            } else {
                throw new BadRequestException("Unsupported file format. Please use CSV or Excel.");
            }
        } catch (IOException | CsvValidationException e) {
            throw new RuntimeException("Failed to parse file: " + e.getMessage(), e);
        }

        List<ProductResponse> responses = new ArrayList<>();
        for (CreateProductRequest request : products) {
            try {
                responses.add(productService.createProduct(request, userId));
            } catch (Exception e) {
                log.error("Failed to import product SKU: " + request.getSku(), e);
                // Optionally continue or throw, depending on requirement. For now, log and continue.
            }
        }
        return responses;
    }

    private List<CreateProductRequest> parseCsv(MultipartFile file) throws IOException, CsvValidationException {
        List<CreateProductRequest> requests = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()));
             CSVReader csvReader = new CSVReader(reader)) {

            String[] header = csvReader.readNext(); // Skip header
            String[] line;
            while ((line = csvReader.readNext()) != null) {
                requests.add(mapRowToRequest(line));
            }
        }
        return requests;
    }

    private List<CreateProductRequest> parseExcel(MultipartFile file) throws IOException {
        List<CreateProductRequest> requests = new ArrayList<>();
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            for (Row row : sheet) {
                if (row.getRowNum() == 0) continue; // Skip header

                // Convert row to string array for uniform processing
                String[] rowData = new String[HEADERS.length];
                boolean isEmpty = true;
                for (int i = 0; i < HEADERS.length; i++) {
                    Cell cell = row.getCell(i, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                    if (cell != null) {
                        rowData[i] = getCellValueAsString(cell);
                        isEmpty = false;
                    } else {
                        rowData[i] = "";
                    }
                }
                
                if (!isEmpty && rowData[0] != null && !rowData[0].isEmpty()) {
                    requests.add(mapRowToRequest(rowData));
                }
            }
        }
        return requests;
    }

    private String getCellValueAsString(Cell cell) {
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().toString();
                }
                return String.valueOf(cell.getNumericCellValue());
            case BOOLEAN: return String.valueOf(cell.getBooleanCellValue());
            case FORMULA: return cell.getCellFormula();
            default: return "";
        }
    }

    private CreateProductRequest mapRowToRequest(String[] row) {
        // row index mapping based on HEADERS
        return CreateProductRequest.builder()
                .sku(getValue(row, 0))
                .productName(getValue(row, 1))
                .description(getValue(row, 2))
                .basePrice(parseBigDecimal(getValue(row, 3)))
                .listPrice(parseBigDecimal(getValue(row, 4)))
                .discount(parseBigDecimal(getValue(row, 5)))
                .currency(getValue(row, 6))
                .unit(getValue(row, 7))
                .taxRate(parseBigDecimal(getValue(row, 8)))
                .taxType(getValue(row, 9))
                .category(getValue(row, 10))
                .subcategory(getValue(row, 11))
                .tags(parseTags(getValue(row, 12)))
                .stockQuantity(parseInteger(getValue(row, 13)))
                .minStockLevel(parseInteger(getValue(row, 14)))
                .maxStockLevel(parseInteger(getValue(row, 15)))
                .reorderLevel(parseInteger(getValue(row, 16)))
                .status(parseStatus(getValue(row, 17)))
                .build();
    }

    private String getValue(String[] row, int index) {
        if (index >= row.length) return null;
        String val = row[index];
        return (val == null || val.trim().isEmpty()) ? null : val.trim();
    }

    private BigDecimal parseBigDecimal(String val) {
        if (val == null) return null;
        try {
            return new BigDecimal(val);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer parseInteger(String val) {
        if (val == null) return null;
        try {
            // Check if it's a double (Excel numeric cells are doubles)
            double d = Double.parseDouble(val);
            return (int) d;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private List<String> parseTags(String val) {
        if (val == null) return new ArrayList<>();
        return Arrays.asList(val.split("\\s*,\\s*"));
    }

    private ProductStatus parseStatus(String val) {
        if (val == null || val.trim().isEmpty()) {
            return ProductStatus.ACTIVE; // Default to ACTIVE
        }
        try {
            return ProductStatus.valueOf(val.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid status value: {}. Defaulting to ACTIVE", val);
            return ProductStatus.ACTIVE;
        }
    }
}
