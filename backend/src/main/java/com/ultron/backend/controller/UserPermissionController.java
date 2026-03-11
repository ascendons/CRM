package com.ultron.backend.controller;

import com.ultron.backend.dto.permission.*;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.service.UserPermissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for managing user-specific permission overrides
 */
@RestController
@RequestMapping("/users/{userId}/permissions")
@RequiredArgsConstructor
@Slf4j
public class UserPermissionController {

    private final UserPermissionService userPermissionService;

    /**
     * Get user's effective permissions (profile + overrides)
     * GET /api/v1/users/{userId}/permissions/effective
     */
    @GetMapping("/effective")
    @PreAuthorize("hasPermission('USER', 'MODIFYALL')")
    public ResponseEntity<ApiResponse<EffectivePermissionsResponse>> getEffectivePermissions(
            @PathVariable String userId) {

        log.info("Fetching effective permissions for user: {}", userId);

        EffectivePermissionsResponse response = userPermissionService.getEffectivePermissions(userId);

        return ResponseEntity.ok(
                ApiResponse.<EffectivePermissionsResponse>builder()
                        .success(true)
                        .message("Effective permissions retrieved successfully")
                        .data(response)
                        .build()
        );
    }

    /**
     * Get user-specific permission overrides only
     * GET /api/v1/users/{userId}/permissions/overrides
     */
    @GetMapping("/overrides")
    @PreAuthorize("hasPermission('USER', 'MODIFYALL')")
    public ResponseEntity<ApiResponse<List<PermissionOverrideDto>>> getUserOverrides(
            @PathVariable String userId) {

        log.info("Fetching permission overrides for user: {}", userId);

        List<PermissionOverrideDto> overrides = userPermissionService.getUserOverrides(userId);

        return ResponseEntity.ok(
                ApiResponse.<List<PermissionOverrideDto>>builder()
                        .success(true)
                        .message("Permission overrides retrieved successfully")
                        .data(overrides)
                        .build()
        );
    }

    /**
     * Grant permission to a user
     * POST /api/v1/users/{userId}/permissions/grant
     */
    @PostMapping("/grant")
    @PreAuthorize("hasPermission('USER', 'MODIFYALL')")
    public ResponseEntity<ApiResponse<Void>> grantPermission(
            @PathVariable String userId,
            @Valid @RequestBody GrantPermissionRequest request) {

        String currentUserId = getCurrentUserId();
        log.info("User {} granting permission {} on {} to user: {}",
                currentUserId, request.getAction(), request.getObjectName(), userId);

        userPermissionService.grantPermission(userId, request, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message(String.format("Permission %s on %s granted successfully",
                                request.getAction(), request.getObjectName()))
                        .build()
        );
    }

    /**
     * Revoke user-specific permission (revert to profile default)
     * POST /api/v1/users/{userId}/permissions/revoke
     */
    @PostMapping("/revoke")
    @PreAuthorize("hasPermission('USER', 'MODIFYALL')")
    public ResponseEntity<ApiResponse<Void>> revokePermission(
            @PathVariable String userId,
            @Valid @RequestBody RevokePermissionRequest request) {

        String currentUserId = getCurrentUserId();
        log.info("User {} revoking permission {} on {} from user: {}",
                currentUserId, request.getAction(), request.getObjectName(), userId);

        userPermissionService.revokePermission(userId, request, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message(String.format("Permission %s on %s revoked successfully",
                                request.getAction(), request.getObjectName()))
                        .build()
        );
    }

    /**
     * Bulk update user permissions
     * PUT /api/v1/users/{userId}/permissions/bulk
     */
    @PutMapping("/bulk")
    @PreAuthorize("hasPermission('USER', 'MODIFYALL')")
    public ResponseEntity<ApiResponse<Void>> bulkUpdatePermissions(
            @PathVariable String userId,
            @Valid @RequestBody BulkUpdatePermissionsRequest request) {

        String currentUserId = getCurrentUserId();
        log.info("User {} bulk updating permissions for user: {}", currentUserId, userId);

        userPermissionService.bulkUpdatePermissions(userId, request, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Permissions updated successfully")
                        .build()
        );
    }

    /**
     * Get current user ID from security context
     */
    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }
}
