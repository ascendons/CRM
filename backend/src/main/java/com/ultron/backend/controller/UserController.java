package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.Profile;
import com.ultron.backend.domain.entity.Role;
import com.ultron.backend.domain.entity.User;
import com.ultron.backend.dto.request.CreateUserRequest;
import com.ultron.backend.dto.request.UpdateUserRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.UserPermissionsResponse;
import com.ultron.backend.dto.response.UserResponse;
import com.ultron.backend.repository.ProfileRepository;
import com.ultron.backend.repository.RoleRepository;
import com.ultron.backend.repository.UserRepository;
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
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ProfileRepository profileRepository;

    @PostMapping
    @PreAuthorize("hasPermission('USER', 'CREATE')")
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
    @PreAuthorize("hasPermission('USER', 'READ')")
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
    @PreAuthorize("hasPermission('USER', 'READ')")
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
    @PreAuthorize("hasPermission('USER', 'READ')")
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
    @PreAuthorize("hasPermission('USER', 'READ')")
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
    @PreAuthorize("hasPermission('USER', 'READ')")
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
    @PreAuthorize("hasPermission('USER', 'READ')")
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
    @PreAuthorize("hasPermission('USER', 'EDIT')")
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
    @PreAuthorize("hasPermission('USER', 'DELETE')")
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
    @PreAuthorize("hasPermission('USER', 'EDIT')")
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

    /**
     * Get current user's full permission manifest
     * Loaded once on login and cached in frontend for instant permission checks
     */
    @GetMapping("/me/permissions")
    public ResponseEntity<ApiResponse<UserPermissionsResponse>> getMyPermissions(
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Loading permission manifest for user: {}", userId);

        // Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get role from database (tenant-aware)
        Role role = roleRepository.findByRoleIdAndTenantId(user.getRoleId(), user.getTenantId())
                .orElseThrow(() -> new RuntimeException("Role not found"));

        // Get profile from database (tenant-aware)
        Profile profile = profileRepository.findByProfileIdAndTenantId(user.getProfileId(), user.getTenantId())
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        // Build permission manifest
        UserPermissionsResponse permissions = UserPermissionsResponse.builder()
                .modules(role.getModulePermissions())
                .objectPermissions(profile.getObjectPermissions())
                .fieldPermissions(profile.getFieldPermissions())
                .systemPermissions(UserPermissionsResponse.SystemPermissionsDTO.builder()
                        .dataVisibility(role.getPermissions() != null ? role.getPermissions().getDataVisibility() : "OWN")
                        .canManageUsers(role.getPermissions() != null ? role.getPermissions().getCanManageUsers() : false)
                        .canManageRoles(role.getPermissions() != null ? role.getPermissions().getCanManageRoles() : false)
                        .canManageProfiles(role.getPermissions() != null ? role.getPermissions().getCanManageProfiles() : false)
                        .canViewSetup(role.getPermissions() != null ? role.getPermissions().getCanViewSetup() : false)
                        .canManageSharing(role.getPermissions() != null ? role.getPermissions().getCanManageSharing() : false)
                        .canViewAllData(role.getPermissions() != null ? role.getPermissions().getCanViewAllData() : false)
                        .canModifyAllData(role.getPermissions() != null ? role.getPermissions().getCanModifyAllData() : false)
                        .canViewAuditLog(role.getPermissions() != null ? role.getPermissions().getCanViewAuditLog() : false)
                        .canExportData(role.getPermissions() != null ? role.getPermissions().getCanExportData() : false)
                        .canImportData(role.getPermissions() != null ? role.getPermissions().getCanImportData() : false)
                        .build())
                .build();

        log.info("Permission manifest loaded successfully for user: {}", userId);
        return ResponseEntity.ok(ApiResponse.success("Permissions loaded successfully", permissions));
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
