package com.ultron.backend.controller;

import com.ultron.backend.dto.request.CreateUserRequest;
import com.ultron.backend.dto.request.UpdateUserRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.UserResponse;
import com.ultron.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;

    @PostMapping
//    @PreAuthorize("hasPermission('USER', 'CREATE')")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody CreateUserRequest request) {

        String currentUserId = getCurrentUserId();
        log.info("User {} creating new user: {}", currentUserId, request.getUsername());

        UserResponse user = userService.createUser(request, currentUserId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.<UserResponse>builder()
                        .success(true)
                        .message("User created successfully")
                        .data(user)
                        .build());
    }

    @GetMapping
//    @PreAuthorize("hasPermission('USER', 'READ')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers(
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly) {

        log.info("Fetching all users (activeOnly: {})", activeOnly);

        List<UserResponse> users = activeOnly
                ? userService.getActiveUsers()
                : userService.getAllUsers();

        return ResponseEntity.ok(
                ApiResponse.<List<UserResponse>>builder()
                        .success(true)
                        .message("Users retrieved successfully")
                        .data(users)
                        .build());
    }

    @GetMapping("/{id}")
//    @PreAuthorize("hasPermission('USER', 'READ')")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable String id) {
        log.info("Fetching user with id: {}", id);
        UserResponse user = userService.getUserById(id);

        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .success(true)
                        .message("User retrieved successfully")
                        .data(user)
                        .build());
    }

    @GetMapping("/code/{userId}")
//    @PreAuthorize("hasPermission('USER', 'READ')")
    public ResponseEntity<ApiResponse<UserResponse>> getUserByUserId(
            @PathVariable String userId) {
        log.info("Fetching user with userId: {}", userId);
        UserResponse user = userService.getUserByUserId(userId);

        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .success(true)
                        .message("User retrieved successfully")
                        .data(user)
                        .build());
    }

    @GetMapping("/role/{roleId}")
//    @PreAuthorize("hasPermission('USER', 'READ')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getUsersByRole(
            @PathVariable String roleId) {
        log.info("Fetching users with roleId: {}", roleId);
        List<UserResponse> users = userService.getUsersByRole(roleId);

        return ResponseEntity.ok(
                ApiResponse.<List<UserResponse>>builder()
                        .success(true)
                        .message("Users retrieved successfully")
                        .data(users)
                        .build());
    }

    @GetMapping("/subordinates/{managerId}")
//    @PreAuthorize("hasPermission('USER', 'READ')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getSubordinates(
            @PathVariable String managerId) {
        log.info("Fetching subordinates for manager: {}", managerId);
        List<UserResponse> subordinates = userService.getSubordinates(managerId);

        return ResponseEntity.ok(
                ApiResponse.<List<UserResponse>>builder()
                        .success(true)
                        .message("Subordinates retrieved successfully")
                        .data(subordinates)
                        .build());
    }

    @GetMapping("/search")
//    @PreAuthorize("hasPermission('USER', 'READ')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> searchUsers(
            @RequestParam String q) {
        log.info("Searching users with query: {}", q);
        List<UserResponse> users = userService.searchUsers(q);

        return ResponseEntity.ok(
                ApiResponse.<List<UserResponse>>builder()
                        .success(true)
                        .message("Search completed successfully")
                        .data(users)
                        .build());
    }

    @PutMapping("/{id}")
//    @PreAuthorize("hasPermission('USER', 'EDIT')")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable String id,
            @Valid @RequestBody UpdateUserRequest request) {

        String currentUserId = getCurrentUserId();
        log.info("User {} updating user: {}", currentUserId, id);

        UserResponse user = userService.updateUser(id, request, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .success(true)
                        .message("User updated successfully")
                        .data(user)
                        .build());
    }

    @PostMapping("/{id}/deactivate")
//    @PreAuthorize("hasPermission('USER', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> deactivateUser(
            @PathVariable String id,
            @RequestParam(required = false) String reason) {

        String currentUserId = getCurrentUserId();
        log.info("User {} deactivating user: {}", currentUserId, id);

        userService.deactivateUser(id, currentUserId, reason);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("User deactivated successfully")
                        .build());
    }

    @PostMapping("/{id}/activate")
//    @PreAuthorize("hasPermission('USER', 'EDIT')")
    public ResponseEntity<ApiResponse<Void>> activateUser(@PathVariable String id) {

        String currentUserId = getCurrentUserId();
        log.info("User {} activating user: {}", currentUserId, id);

        userService.activateUser(id, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("User activated successfully")
                        .build());
    }

    // Helper method to get current user ID from Security Context
    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        return "system";  // Default fallback
    }
}
