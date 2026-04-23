package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.SavedReport;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.service.ReportBuilderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportBuilderService reportBuilderService;

    @GetMapping
    @PreAuthorize("hasPermission('REPORTS', 'VIEW')")
    public ResponseEntity<ApiResponse<List<SavedReport>>> getAll() {
        return ResponseEntity.ok(ApiResponse.<List<SavedReport>>builder()
                .success(true).data(reportBuilderService.getAll()).build());
    }

    @PostMapping
    @PreAuthorize("hasPermission('REPORTS', 'CREATE')")
    public ResponseEntity<ApiResponse<SavedReport>> create(@RequestBody SavedReport report) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<SavedReport>builder()
                .success(true).data(reportBuilderService.createReport(report)).build());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('REPORTS', 'VIEW')")
    public ResponseEntity<ApiResponse<SavedReport>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.<SavedReport>builder()
                .success(true).data(reportBuilderService.getById(id)).build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('REPORTS', 'EDIT')")
    public ResponseEntity<ApiResponse<SavedReport>> update(@PathVariable String id, @RequestBody SavedReport report) {
        return ResponseEntity.ok(ApiResponse.<SavedReport>builder()
                .success(true).data(reportBuilderService.updateReport(id, report)).build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('REPORTS', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        reportBuilderService.deleteReport(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Deleted").build());
    }

    @PostMapping("/{id}/run")
    @PreAuthorize("hasPermission('REPORTS', 'VIEW')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> run(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.<List<Map<String, Object>>>builder()
                .success(true).data(reportBuilderService.runReport(id)).build());
    }
}
