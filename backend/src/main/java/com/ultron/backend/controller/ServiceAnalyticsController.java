package com.ultron.backend.controller;

import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.service.InventoryAnalyticsService;
import com.ultron.backend.service.ServiceAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/analytics/service")
@RequiredArgsConstructor
@Slf4j
public class ServiceAnalyticsController {

    private final ServiceAnalyticsService serviceAnalyticsService;
    private final InventoryAnalyticsService inventoryAnalyticsService;

    @GetMapping("/kpis")
    @PreAuthorize("hasPermission('SERVICE_ANALYTICS', 'VIEW')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getKpiSummary() {
        return ResponseEntity.ok(ApiResponse.success("Service KPIs retrieved",
                serviceAnalyticsService.getKpiSummary()));
    }

    @GetMapping("/volume")
    @PreAuthorize("hasPermission('SERVICE_ANALYTICS', 'VIEW')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getVolumeByTypeAndPriority() {
        return ResponseEntity.ok(ApiResponse.success("WO volume retrieved",
                serviceAnalyticsService.getVolumeByTypeAndPriority()));
    }

    @GetMapping("/parts-availability")
    @PreAuthorize("hasPermission('SERVICE_ANALYTICS', 'VIEW')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPartsAvailabilityRate() {
        return ResponseEntity.ok(ApiResponse.success("Parts availability rate retrieved",
                serviceAnalyticsService.getPartsAvailabilityRate()));
    }

    @GetMapping("/inventory/dead-stock")
    @PreAuthorize("hasPermission('SERVICE_ANALYTICS', 'VIEW')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDeadStockReport() {
        return ResponseEntity.ok(ApiResponse.success("Dead stock report retrieved",
                inventoryAnalyticsService.getDeadStockReport()));
    }

    @GetMapping("/inventory/reorder")
    @PreAuthorize("hasPermission('SERVICE_ANALYTICS', 'VIEW')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getReorderRecommendations() {
        return ResponseEntity.ok(ApiResponse.success("Reorder recommendations retrieved",
                inventoryAnalyticsService.getReorderRecommendations()));
    }

    @GetMapping("/inventory/top-consumed")
    @PreAuthorize("hasPermission('SERVICE_ANALYTICS', 'VIEW')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTopConsumedParts(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(ApiResponse.success("Top consumed parts retrieved",
                inventoryAnalyticsService.getTopConsumedParts(limit)));
    }
}
