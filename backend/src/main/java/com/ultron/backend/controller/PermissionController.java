package com.ultron.backend.controller;

import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.service.PermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/permissions")
@RequiredArgsConstructor
@Slf4j
public class PermissionController {

    private final PermissionService permissionService;

    /**
     * Check if current user has permission on an object.
     * GET /api/v1/permissions/check?object=USER&action=create
     */
    @GetMapping("/check")
    public ResponseEntity<ApiResponse<Boolean>> checkPermission(
            @RequestParam String object,
            @RequestParam String action,
            Authentication authentication) {

        try {
            String currentUserId = authentication.getName();
            // log.debug("Check permission request: user={}, object={}, action={}", currentUserId, object, action);

            boolean hasPermission = permissionService.hasPermission(currentUserId, object, action);

            return ResponseEntity.ok(
                    ApiResponse.<Boolean>builder()
                            .success(true)
                            .message("Permission check completed")
                            .data(hasPermission)
                            .build());
        } catch (Exception e) {
            log.error("Error in checkPermission", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<Boolean>builder()
                            .success(false)
                            .message("Error: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Check if current user has a system permission.
     * GET /api/v1/permissions/system?permission=canManageUsers
     */
    @GetMapping("/system")
    public ResponseEntity<ApiResponse<Boolean>> checkSystemPermission(
            @RequestParam String permission,
            Authentication authentication) {

        try {
            String currentUserId = authentication.getName();
            // log.debug("Check system permission request: user={}, permission={}", currentUserId, permission);

            boolean hasPermission = permissionService.hasSystemPermission(currentUserId, permission);

            return ResponseEntity.ok(
                    ApiResponse.<Boolean>builder()
                            .success(true)
                            .message("System permission check completed")
                            .data(hasPermission)
                            .build());
        } catch (Exception e) {
            log.error("Error in checkSystemPermission", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<Boolean>builder()
                            .success(false)
                            .message("Error: " + e.getMessage())
                            .build());
        }
    }
}
