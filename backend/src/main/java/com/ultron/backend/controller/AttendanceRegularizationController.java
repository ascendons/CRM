package com.ultron.backend.controller;

import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.regularization.ApproveRegularizationRequest;
import com.ultron.backend.dto.regularization.CreateRegularizationRequest;
import com.ultron.backend.dto.regularization.RegularizationResponse;
import com.ultron.backend.service.AttendanceRegularizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for attendance regularization
 */
@RestController
@RequestMapping("/api/attendance/regularizations")
@RequiredArgsConstructor
@Slf4j
public class AttendanceRegularizationController {

    private final AttendanceRegularizationService regularizationService;

    /**
     * Request attendance regularization
     */
    @PostMapping
    @PreAuthorize("hasPermission('ATTENDANCE', 'CREATE')")
    public ResponseEntity<ApiResponse<RegularizationResponse>> requestRegularization(
            @Valid @RequestBody CreateRegularizationRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("User {} requesting attendance regularization", userId);

        RegularizationResponse response = regularizationService.requestRegularization(request, userId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<RegularizationResponse>builder()
                        .success(true)
                        .message("Regularization request submitted successfully")
                        .data(response)
                        .build());
    }

    /**
     * Get my regularizations
     */
    @GetMapping("/my")
    @PreAuthorize("hasPermission('ATTENDANCE', 'READ')")
    public ResponseEntity<ApiResponse<List<RegularizationResponse>>> getMyRegularizations(
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("User {} fetching their regularizations", userId);

        List<RegularizationResponse> regularizations = regularizationService.getMyRegularizations(userId);

        return ResponseEntity.ok(
                ApiResponse.<List<RegularizationResponse>>builder()
                        .success(true)
                        .message("Regularizations retrieved successfully")
                        .data(regularizations)
                        .build());
    }

    /**
     * Get regularization by ID
     */
    @GetMapping("/{regularizationId}")
    @PreAuthorize("hasPermission('ATTENDANCE', 'READ')")
    public ResponseEntity<ApiResponse<RegularizationResponse>> getRegularizationById(
            @PathVariable String regularizationId) {
        log.info("Fetching regularization: {}", regularizationId);

        RegularizationResponse regularization = regularizationService.getRegularizationById(regularizationId);

        return ResponseEntity.ok(
                ApiResponse.<RegularizationResponse>builder()
                        .success(true)
                        .message("Regularization retrieved successfully")
                        .data(regularization)
                        .build());
    }

    /**
     * Get pending approvals (Manager)
     */
    @GetMapping("/admin/pending")
    @PreAuthorize("hasPermission('ATTENDANCE', 'APPROVE')")
    public ResponseEntity<ApiResponse<List<RegularizationResponse>>> getPendingApprovals(
            Authentication authentication) {
        String managerId = authentication.getName();
        log.info("Manager {} fetching pending regularization approvals", managerId);

        List<RegularizationResponse> regularizations = regularizationService.getPendingApprovals(managerId);

        return ResponseEntity.ok(
                ApiResponse.<List<RegularizationResponse>>builder()
                        .success(true)
                        .message("Pending approvals retrieved successfully")
                        .data(regularizations)
                        .build());
    }

    /**
     * Get all pending regularizations (Admin)
     */
    @GetMapping("/admin/all-pending")
    @PreAuthorize("hasPermission('ATTENDANCE', 'READ_ALL')")
    public ResponseEntity<ApiResponse<List<RegularizationResponse>>> getAllPendingRegularizations() {
        log.info("Admin fetching all pending regularizations");

        List<RegularizationResponse> regularizations = regularizationService.getAllPendingRegularizations();

        return ResponseEntity.ok(
                ApiResponse.<List<RegularizationResponse>>builder()
                        .success(true)
                        .message("All pending regularizations retrieved successfully")
                        .data(regularizations)
                        .build());
    }

    /**
     * Approve or reject regularization (Manager)
     */
    @PostMapping("/admin/approve")
    @PreAuthorize("hasPermission('ATTENDANCE', 'APPROVE')")
    public ResponseEntity<ApiResponse<RegularizationResponse>> approveRegularization(
            @Valid @RequestBody ApproveRegularizationRequest request,
            Authentication authentication) {
        String managerId = authentication.getName();
        log.info("Manager {} {} regularization: {}",
                managerId,
                request.getApproved() ? "approving" : "rejecting",
                request.getRegularizationId());

        RegularizationResponse response = regularizationService.approveRegularization(request, managerId);

        return ResponseEntity.ok(
                ApiResponse.<RegularizationResponse>builder()
                        .success(true)
                        .message(request.getApproved()
                                ? "Regularization approved successfully"
                                : "Regularization rejected successfully")
                        .data(response)
                        .build());
    }
}
