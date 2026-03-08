package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.LeavePolicy;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.service.LeavePolicyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

/**
 * REST API for Leave Policy Management
 */
@RestController
@RequestMapping("/admin/leave-policy")
@RequiredArgsConstructor
@Slf4j
public class LeavePolicyController {

    private final LeavePolicyService leavePolicyService;

    /**
     * Get current leave policy
     */
    @GetMapping
    @PreAuthorize("hasPermission('LEAVE', 'READ')")
    public ResponseEntity<ApiResponse<LeavePolicy>> getPolicy() {
        log.info("Fetching leave policy");

        LeavePolicy policy = leavePolicyService.getPolicy();

        return ResponseEntity.ok(
                ApiResponse.<LeavePolicy>builder()
                        .success(true)
                        .message("Leave policy retrieved successfully")
                        .data(policy)
                        .build()
        );
    }

    /**
     * Update leave policy (Admin only)
     */
    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LeavePolicy>> updatePolicy(
            @RequestBody LeavePolicy policy,
            Authentication authentication) {

        String userId = authentication.getName();
        log.info("Updating leave policy by user: {}", userId);

        LeavePolicy updated = leavePolicyService.updatePolicy(policy, userId);

        return ResponseEntity.ok(
                ApiResponse.<LeavePolicy>builder()
                        .success(true)
                        .message("Leave policy updated successfully")
                        .data(updated)
                        .build()
        );
    }
}
