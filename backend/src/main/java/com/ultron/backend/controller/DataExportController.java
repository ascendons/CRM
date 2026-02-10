package com.ultron.backend.controller;

import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.service.TenantDataExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * Controller for tenant data export
 * Supports GDPR compliance and data portability
 */
@RestController
@RequestMapping("/data-export")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Data Export", description = "Tenant data export for GDPR compliance")
@SecurityRequirement(name = "bearer-jwt")
public class DataExportController {

    private final TenantDataExportService dataExportService;

    /**
     * Get export summary
     */
    @GetMapping("/summary")
    @Operation(
            summary = "Get export summary",
            description = "Retrieve summary of data available for export"
    )
    public ResponseEntity<ApiResponse<Map<String, Object>>> getExportSummary() {
        log.info("Fetching export summary");

        Map<String, Object> summary = dataExportService.getExportSummary();

        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .message("Export summary retrieved successfully")
                .data(summary)
                .build());
    }

    /**
     * Export all tenant data
     * Returns a ZIP file containing all data in JSON format
     */
    @GetMapping("/full")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Export all tenant data",
            description = "Download all tenant data as ZIP file (admin only)"
    )
    public ResponseEntity<ByteArrayResource> exportAllData() throws IOException {
        log.info("Starting full data export");

        byte[] zipData = dataExportService.exportAllData();

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filename = String.format("tenant_data_export_%s.zip", timestamp);

        ByteArrayResource resource = new ByteArrayResource(zipData);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(zipData.length)
                .body(resource);
    }

    /**
     * Export specific entity data
     */
    @GetMapping("/entity/{entityType}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Export specific entity data",
            description = "Download specific entity data as ZIP file (admin only)"
    )
    public ResponseEntity<ByteArrayResource> exportEntityData(
            @PathVariable String entityType) throws IOException {

        log.info("Starting entity export: {}", entityType);

        byte[] zipData = dataExportService.exportEntityData(entityType);

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filename = String.format("%s_export_%s.zip", entityType.toLowerCase(), timestamp);

        ByteArrayResource resource = new ByteArrayResource(zipData);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(zipData.length)
                .body(resource);
    }

    /**
     * Request data export (async)
     * For large datasets, this endpoint would trigger an async export
     * and send an email notification when ready
     */
    @PostMapping("/request")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Request data export",
            description = "Request async data export for large datasets (admin only)"
    )
    public ResponseEntity<ApiResponse<ExportRequestResponse>> requestDataExport(
            @RequestParam(required = false) String entityType) {

        log.info("Data export requested: {}", entityType != null ? entityType : "ALL");

        // TODO: Implement async export with job queue
        // For now, return synchronous response

        Map<String, Object> summary = dataExportService.getExportSummary();

        ExportRequestResponse response = ExportRequestResponse.builder()
                .status("READY")
                .message("Data is ready for download. Use GET /data-export/full endpoint")
                .recordCount((Long) summary.get("totalRecords"))
                .estimatedSizeMB((Double) summary.get("estimatedSizeMB"))
                .build();

        return ResponseEntity.ok(ApiResponse.<ExportRequestResponse>builder()
                .success(true)
                .message("Export request processed")
                .data(response)
                .build());
    }

    // Response DTOs
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ExportRequestResponse {
        private String status;
        private String message;
        private Long recordCount;
        private Double estimatedSizeMB;
    }
}
