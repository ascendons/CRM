package com.ultron.backend.controller;

import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.leave.*;
import com.ultron.backend.service.LeaveService;
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
 * REST controller for leave management
 */
@RestController
@RequestMapping("/leaves")
@RequiredArgsConstructor
@Slf4j
public class LeaveController {

    private final LeaveService leaveService;

    /**
     * Apply for leave
     */
    @PostMapping
    @PreAuthorize("hasPermission('LEAVE', 'CREATE')")
    public ResponseEntity<ApiResponse<LeaveResponse>> applyLeave(
            @Valid @RequestBody CreateLeaveRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("User {} applying for leave", userId);

        LeaveResponse response = leaveService.applyLeave(request, userId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<LeaveResponse>builder()
                        .success(true)
                        .message("Leave applied successfully. Pending approval.")
                        .data(response)
                        .build());
    }

    /**
     * Get my leaves
     */
    @GetMapping("/my")
    @PreAuthorize("hasPermission('LEAVE', 'READ')")
    public ResponseEntity<ApiResponse<List<LeaveResponse>>> getMyLeaves(
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("User {} fetching their leaves", userId);

        List<LeaveResponse> leaves = leaveService.getMyLeaves(userId);

        return ResponseEntity.ok(
                ApiResponse.<List<LeaveResponse>>builder()
                        .success(true)
                        .message("Leaves retrieved successfully")
                        .data(leaves)
                        .build());
    }

    /**
     * Get leave by ID
     */
    @GetMapping("/{leaveId}")
    @PreAuthorize("hasPermission('LEAVE', 'READ')")
    public ResponseEntity<ApiResponse<LeaveResponse>> getLeaveById(
            @PathVariable String leaveId) {
        log.info("Fetching leave: {}", leaveId);

        LeaveResponse leave = leaveService.getLeaveById(leaveId);

        return ResponseEntity.ok(
                ApiResponse.<LeaveResponse>builder()
                        .success(true)
                        .message("Leave retrieved successfully")
                        .data(leave)
                        .build());
    }

    /**
     * Cancel leave
     */
    @PostMapping("/cancel")
    @PreAuthorize("hasPermission('LEAVE', 'CANCEL')")
    public ResponseEntity<ApiResponse<LeaveResponse>> cancelLeave(
            @Valid @RequestBody CancelLeaveRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("User {} cancelling leave: {}", userId, request.getLeaveId());

        LeaveResponse response = leaveService.cancelLeave(request, userId);

        return ResponseEntity.ok(
                ApiResponse.<LeaveResponse>builder()
                        .success(true)
                        .message("Leave cancelled successfully")
                        .data(response)
                        .build());
    }

    /**
     * Get leave balance
     */
    @GetMapping("/my/balance")
    @PreAuthorize("hasPermission('LEAVE', 'READ')")
    public ResponseEntity<ApiResponse<LeaveBalanceResponse>> getMyBalance(
            @RequestParam(required = false) Integer year,
            Authentication authentication) {
        String userId = authentication.getName();
        int targetYear = (year != null) ? year : java.time.LocalDate.now().getYear();
        log.info("User {} fetching leave balance for year: {}", userId, targetYear);

        LeaveBalanceResponse balance = leaveService.getMyBalance(userId, targetYear);

        return ResponseEntity.ok(
                ApiResponse.<LeaveBalanceResponse>builder()
                        .success(true)
                        .message("Leave balance retrieved successfully")
                        .data(balance)
                        .build());
    }

    /**
     * Get pending approvals (Manager)
     */
    @GetMapping("/admin/pending")
    @PreAuthorize("hasPermission('LEAVE', 'APPROVE')")
    public ResponseEntity<ApiResponse<List<LeaveResponse>>> getPendingApprovals(
            Authentication authentication) {
        String managerId = authentication.getName();
        log.info("Manager {} fetching pending approvals", managerId);

        List<LeaveResponse> leaves = leaveService.getPendingApprovals(managerId);

        return ResponseEntity.ok(
                ApiResponse.<List<LeaveResponse>>builder()
                        .success(true)
                        .message("Pending approvals retrieved successfully")
                        .data(leaves)
                        .build());
    }

    /**
     * Get all pending approvals (Admin)
     */
    @GetMapping("/admin/all-pending")
    @PreAuthorize("hasPermission('LEAVE', 'READ_ALL')")
    public ResponseEntity<ApiResponse<List<LeaveResponse>>> getAllPendingApprovals() {
        log.info("Admin fetching all pending approvals");

        List<LeaveResponse> leaves = leaveService.getAllPendingApprovals();

        return ResponseEntity.ok(
                ApiResponse.<List<LeaveResponse>>builder()
                        .success(true)
                        .message("All pending approvals retrieved successfully")
                        .data(leaves)
                        .build());
    }

    /**
     * Approve or reject leave (Manager)
     */
    @PostMapping("/admin/approve")
    @PreAuthorize("hasPermission('LEAVE', 'APPROVE')")
    public ResponseEntity<ApiResponse<LeaveResponse>> approveLeave(
            @Valid @RequestBody ApproveLeaveRequest request,
            Authentication authentication) {
        String managerId = authentication.getName();
        log.info("Manager {} {} leave: {}",
                managerId,
                request.getApproved() ? "approving" : "rejecting",
                request.getLeaveId());

        LeaveResponse response = leaveService.approveLeave(request, managerId);

        return ResponseEntity.ok(
                ApiResponse.<LeaveResponse>builder()
                        .success(true)
                        .message(request.getApproved() ? "Leave approved successfully" : "Leave rejected successfully")
                        .data(response)
                        .build());
    }
}
