package com.ultron.backend.controller;

import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.service.TenantAnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for tenant analytics and reporting
 * Provides dashboard metrics, growth trends, and performance insights
 */
@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Analytics", description = "Tenant analytics and reporting endpoints")
@SecurityRequirement(name = "bearer-jwt")
public class AnalyticsController {

    private final TenantAnalyticsService analyticsService;

    /**
     * Get comprehensive dashboard statistics
     */
    @GetMapping("/dashboard")
    @Operation(
            summary = "Get dashboard statistics",
            description = "Retrieve comprehensive dashboard metrics for the current tenant"
    )
    public ResponseEntity<ApiResponse<TenantAnalyticsService.DashboardStats>> getDashboardStats() {
        log.info("Fetching dashboard statistics");

        TenantAnalyticsService.DashboardStats stats = analyticsService.getDashboardStats();

        return ResponseEntity.ok(ApiResponse.<TenantAnalyticsService.DashboardStats>builder()
                .success(true)
                .message("Dashboard statistics retrieved successfully")
                .data(stats)
                .build());
    }

    /**
     * Get growth trends
     */
    @GetMapping("/growth-trends")
    @Operation(
            summary = "Get growth trends",
            description = "Retrieve growth trends over specified period"
    )
    public ResponseEntity<ApiResponse<TenantAnalyticsService.GrowthTrends>> getGrowthTrends(
            @RequestParam(defaultValue = "30") int days) {
        log.info("Fetching growth trends for {} days", days);

        TenantAnalyticsService.GrowthTrends trends = analyticsService.getGrowthTrends(days);

        return ResponseEntity.ok(ApiResponse.<TenantAnalyticsService.GrowthTrends>builder()
                .success(true)
                .message("Growth trends retrieved successfully")
                .data(trends)
                .build());
    }
}
