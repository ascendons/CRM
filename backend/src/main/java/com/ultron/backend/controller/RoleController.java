package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.Role;
import com.ultron.backend.dto.request.CreateRoleRequest;
import com.ultron.backend.dto.request.UpdateModulePermissionsRequest;
import com.ultron.backend.dto.request.UpdateRoleRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.ModuleDefinitionResponse;
import com.ultron.backend.dto.response.ModulePermissionResponse;
import com.ultron.backend.dto.response.RoleResponse;
import com.ultron.backend.service.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * REST controller for role management.
 * All endpoints require appropriate permissions checked via @PreAuthorize.
 */
@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
@Slf4j
public class RoleController {

    private final RoleService roleService;

    @PostMapping
    @PreAuthorize("hasPermission('ROLE', 'CREATE')")
    public ResponseEntity<ApiResponse<RoleResponse>> createRole(
            @Valid @RequestBody CreateRoleRequest request,
            Authentication authentication) {
        log.info("Creating role: {}", request.getRoleName());
        String createdBy = authentication.getName();
        RoleResponse response = roleService.createRole(request, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Role created successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasPermission('ROLE', 'READ')")
    public ResponseEntity<ApiResponse<List<RoleResponse>>> getAllRoles(
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly) {
        log.info("Fetching all roles (activeOnly: {})", activeOnly);
        List<RoleResponse> roles = activeOnly ? roleService.getActiveRoles() : roleService.getAllRoles();
        return ResponseEntity.ok(ApiResponse.success("Roles fetched successfully", roles));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('ROLE', 'READ')")
    public ResponseEntity<ApiResponse<RoleResponse>> getRoleById(@PathVariable String id) {
        log.info("Fetching role by id: {}", id);
        RoleResponse response = roleService.getRoleById(id);
        return ResponseEntity.ok(ApiResponse.success("Role fetched successfully", response));
    }

    @GetMapping("/code/{roleId}")
    @PreAuthorize("hasPermission('ROLE', 'READ')")
    public ResponseEntity<ApiResponse<RoleResponse>> getRoleByRoleId(@PathVariable String roleId) {
        log.info("Fetching role by roleId: {}", roleId);
        RoleResponse response = roleService.getRoleByRoleId(roleId);
        return ResponseEntity.ok(ApiResponse.success("Role fetched successfully", response));
    }

    @GetMapping("/root")
    @PreAuthorize("hasPermission('ROLE', 'READ')")
    public ResponseEntity<ApiResponse<List<RoleResponse>>> getRootRoles() {
        log.info("Fetching root roles");
        List<RoleResponse> roles = roleService.getRootRoles();
        return ResponseEntity.ok(ApiResponse.success("Root roles fetched successfully", roles));
    }

    @GetMapping("/children/{parentRoleId}")
    @PreAuthorize("hasPermission('ROLE', 'READ')")
    public ResponseEntity<ApiResponse<List<RoleResponse>>> getChildRoles(@PathVariable String parentRoleId) {
        log.info("Fetching child roles for parent: {}", parentRoleId);
        List<RoleResponse> roles = roleService.getChildRoles(parentRoleId);
        return ResponseEntity.ok(ApiResponse.success("Child roles fetched successfully", roles));
    }

    @GetMapping("/search")
    @PreAuthorize("hasPermission('ROLE', 'READ')")
    public ResponseEntity<ApiResponse<List<RoleResponse>>> searchRoles(
            @RequestParam String query) {
        log.info("Searching roles with query: {}", query);
        List<RoleResponse> roles = roleService.searchRoles(query);
        return ResponseEntity.ok(ApiResponse.success("Roles search completed", roles));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('ROLE', 'EDIT')")
    public ResponseEntity<ApiResponse<RoleResponse>> updateRole(
            @PathVariable String id,
            @Valid @RequestBody UpdateRoleRequest request,
            Authentication authentication) {
        log.info("Updating role with id: {}", id);
        String modifiedBy = authentication.getName();
        RoleResponse response = roleService.updateRole(id, request, modifiedBy);
        return ResponseEntity.ok(ApiResponse.success("Role updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('ROLE', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteRole(
            @PathVariable String id,
            Authentication authentication) {
        log.info("Deleting role with id: {}", id);
        String deletedBy = authentication.getName();
        roleService.deleteRole(id, deletedBy);
        return ResponseEntity.ok(ApiResponse.success("Role deleted successfully", null));
    }

    // ===== MODULE PERMISSION ENDPOINTS (LEAN RBAC) =====

    /**
     * Get module permissions for a role
     */
    @GetMapping("/{roleId}/modules")
    @PreAuthorize("hasPermission('ROLE', 'READ')")
    public ResponseEntity<ApiResponse<List<ModulePermissionResponse>>> getModulePermissions(
            @PathVariable String roleId) {
        log.info("Fetching module permissions for roleId: {}", roleId);

        List<Role.ModulePermission> permissions = roleService.getModulePermissions(roleId);

        List<ModulePermissionResponse> response = permissions.stream()
                .map(mp -> ModulePermissionResponse.builder()
                        .moduleName(mp.getModuleName())
                        .displayName(mp.getDisplayName())
                        .canAccess(mp.getCanAccess())
                        .includedPaths(mp.getIncludedPaths())
                        .description(mp.getDescription())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("Module permissions fetched successfully", response));
    }

    /**
     * Update module permissions for a role
     */
    @PutMapping("/{roleId}/modules")
    @PreAuthorize("hasPermission('ROLE', 'EDIT')")
    public ResponseEntity<ApiResponse<Void>> updateModulePermissions(
            @PathVariable String roleId,
            @Valid @RequestBody UpdateModulePermissionsRequest request,
            Authentication authentication) {
        log.info("Updating module permissions for roleId: {}", roleId);

        String modifiedBy = authentication.getName();

        // Convert DTO to entity
        List<Role.ModulePermission> modulePermissions = request.getModulePermissions().stream()
                .map(dto -> Role.ModulePermission.builder()
                        .moduleName(dto.getModuleName())
                        .displayName(dto.getDisplayName())
                        .canAccess(dto.getCanAccess())
                        .includedPaths(dto.getIncludedPaths())
                        .description(dto.getDescription())
                        .build())
                .collect(Collectors.toList());

        roleService.updateModulePermissions(roleId, modulePermissions, modifiedBy);

        return ResponseEntity.ok(ApiResponse.success("Module permissions updated successfully", null));
    }

    /**
     * Get available modules (hardcoded registry)
     * These are the modules that can be assigned to roles
     */
    @GetMapping("/modules/available")
    @PreAuthorize("hasPermission('ROLE', 'READ')")
    public ResponseEntity<ApiResponse<List<ModuleDefinitionResponse>>> getAvailableModules() {
        log.info("Fetching available modules");

        List<ModuleDefinitionResponse> modules = Arrays.asList(
                ModuleDefinitionResponse.builder()
                        .moduleName("CRM")
                        .displayName("Customer Management")
                        .includedPaths(Arrays.asList("/leads", "/contacts", "/accounts", "/opportunities"))
                        .description("Manage customer relationships, leads, and opportunities")
                        .category("Sales")
                        .build(),
                ModuleDefinitionResponse.builder()
                        .moduleName("ADMINISTRATION")
                        .displayName("Admin Panel")
                        .includedPaths(Arrays.asList("/admin/users", "/admin/roles", "/admin/products", "/settings"))
                        .description("User management, roles, and system settings")
                        .category("System")
                        .build(),
                ModuleDefinitionResponse.builder()
                        .moduleName("ANALYTICS")
                        .displayName("Analytics & Reports")
                        .includedPaths(Arrays.asList("/dashboard", "/analytics"))
                        .description("View dashboards, reports, and analytics")
                        .category("Insights")
                        .build(),
                ModuleDefinitionResponse.builder()
                        .moduleName("PRODUCTS")
                        .displayName("Product Management")
                        .includedPaths(Arrays.asList("/products", "/catalog", "/proposals"))
                        .description("Manage products, catalog, and proposals")
                        .category("Sales")
                        .build(),
                ModuleDefinitionResponse.builder()
                        .moduleName("ACTIVITIES")
                        .displayName("Activities")
                        .includedPaths(Arrays.asList("/activities", "/user-activities"))
                        .description("Track and manage activities")
                        .category("Productivity")
                        .build()
        );

        return ResponseEntity.ok(ApiResponse.success("Available modules fetched successfully", modules));
    }
}
