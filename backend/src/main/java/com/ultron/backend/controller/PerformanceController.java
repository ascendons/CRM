package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.PerformanceReview;
import com.ultron.backend.domain.entity.ReviewCycle;
import com.ultron.backend.dto.performance.CreatePerformanceReviewRequest;
import com.ultron.backend.dto.performance.CreateReviewCycleRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.service.PerformanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController @RequestMapping("/hr/performance") @RequiredArgsConstructor
public class PerformanceController {
    private final PerformanceService performanceService;

    private String currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }

    @GetMapping("/cycles")
    @PreAuthorize("hasPermission('PERFORMANCE_REVIEWS', 'VIEW')")
    public ResponseEntity<ApiResponse<List<ReviewCycle>>> getCycles() {
        return ResponseEntity.ok(ApiResponse.<List<ReviewCycle>>builder().success(true).data(performanceService.getCycles()).build());
    }

    @PostMapping("/cycles")
    @PreAuthorize("hasPermission('PERFORMANCE_REVIEWS', 'CREATE')")
    public ResponseEntity<ApiResponse<ReviewCycle>> createCycle(@RequestBody CreateReviewCycleRequest req) {
        return ResponseEntity.ok(ApiResponse.<ReviewCycle>builder().success(true).data(performanceService.createCycle(req, currentUserId())).build());
    }

    @DeleteMapping("/cycles/{cycleId}")
    @PreAuthorize("hasPermission('PERFORMANCE_REVIEWS', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteCycle(@PathVariable String cycleId) {
        performanceService.deleteCycle(cycleId, currentUserId());
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Deleted").build());
    }

    @GetMapping("/cycles/{cycleId}/reviews")
    @PreAuthorize("hasPermission('PERFORMANCE_REVIEWS', 'VIEW')")
    public ResponseEntity<ApiResponse<List<PerformanceReview>>> getReviews(@PathVariable String cycleId) {
        return ResponseEntity.ok(ApiResponse.<List<PerformanceReview>>builder().success(true).data(performanceService.getReviewsByCycle(cycleId)).build());
    }

    @PostMapping("/reviews")
    @PreAuthorize("hasPermission('PERFORMANCE_REVIEWS', 'CREATE')")
    public ResponseEntity<ApiResponse<PerformanceReview>> createReview(@RequestBody CreatePerformanceReviewRequest req) {
        return ResponseEntity.ok(ApiResponse.<PerformanceReview>builder().success(true).data(performanceService.createReview(req, currentUserId())).build());
    }

    @PostMapping("/reviews/{reviewId}/submit")
    @PreAuthorize("hasPermission('PERFORMANCE_REVIEWS', 'SUBMIT')")
    public ResponseEntity<ApiResponse<PerformanceReview>> submit(@PathVariable String reviewId) {
        return ResponseEntity.ok(ApiResponse.<PerformanceReview>builder().success(true).data(performanceService.submitReview(reviewId, currentUserId())).build());
    }

    @PostMapping("/reviews/{reviewId}/acknowledge")
    @PreAuthorize("hasPermission('PERFORMANCE_REVIEWS', 'EDIT')")
    public ResponseEntity<ApiResponse<PerformanceReview>> acknowledge(@PathVariable String reviewId) {
        return ResponseEntity.ok(ApiResponse.<PerformanceReview>builder().success(true).data(performanceService.acknowledgeReview(reviewId, currentUserId())).build());
    }
}
