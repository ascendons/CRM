package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Role;
import com.ultron.backend.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Service to migrate hardcoded roles from PredefinedRoles.java to MongoDB
 * and seed default roles for new tenants
 *
 * LEAN RBAC VERSION: Uses module-based permissions instead of individual pages
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RoleMigrationService {

    private final RoleRepository roleRepository;
    private final RoleIdGeneratorService roleIdGeneratorService;

    /**
     * Migrate predefined roles from constants to database
     * Run once on application startup
     * Creates system roles (templates) that can be cloned for each tenant
     */
    public void migratePredefinedRolesToDatabase() {
        log.info("========================================");
        log.info("Starting Role Migration to Database");
        log.info("========================================");

        // Check if system roles already exist
        List<Role> existingSystemRoles = roleRepository.findByIsSystemRoleTrueAndIsDeletedFalse();
        if (!existingSystemRoles.isEmpty()) {
            log.info("System roles already exist in database. Skipping migration.");
            log.info("Found {} system roles", existingSystemRoles.size());
            return;
        }

        try {
            // Create 4 system roles
            createSystemAdministratorRole();
            createSalesManagerRole();
            createSalesRepresentativeRole();
            createReadOnlyUserRole();

            log.info("========================================");
            log.info("Role Migration Completed Successfully");
            log.info("Created 4 system roles as templates");
            log.info("========================================");
        } catch (Exception e) {
            log.error("Role migration failed: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to migrate roles to database", e);
        }
    }

    /**
     * Seed default roles for a new tenant
     * Called when a new organization is created
     */
    public void seedDefaultRolesForTenant(String tenantId) {
        log.info("[Tenant: {}] Seeding default roles", tenantId);

        // Check if roles already exist for this tenant
        List<Role> existingRoles = roleRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        if (!existingRoles.isEmpty()) {
            log.info("[Tenant: {}] Roles already exist. Skipping seed.", tenantId);
            return;
        }

        // Get system roles (templates)
        List<Role> systemRoles = roleRepository.findByIsSystemRoleTrueAndIsDeletedFalse();
        if (systemRoles.isEmpty()) {
            log.error("[Tenant: {}] No system roles found. Running migration first.", tenantId);
            migratePredefinedRolesToDatabase();
            systemRoles = roleRepository.findByIsSystemRoleTrueAndIsDeletedFalse();
        }

        // Clone each system role for this tenant
        for (Role systemRole : systemRoles) {
            Role tenantRole = Role.builder()
                    .roleId(roleIdGeneratorService.generateRoleId())
                    .tenantId(tenantId)
                    .isSystemRole(false)  // Not a system role, tenant-specific
                    .roleName(systemRole.getRoleName())
                    .description(systemRole.getDescription())
                    .parentRoleId(systemRole.getParentRoleId())
                    .parentRoleName(systemRole.getParentRoleName())
                    .level(systemRole.getLevel())
                    .childRoleIds(systemRole.getChildRoleIds() != null ? new ArrayList<>(systemRole.getChildRoleIds()) : null)
                    .modulePermissions(systemRole.getModulePermissions() != null ? new ArrayList<>(systemRole.getModulePermissions()) : null)
                    .permissions(systemRole.getPermissions())
                    .isActive(true)
                    .isDeleted(false)
                    .createdAt(LocalDateTime.now())
                    .createdBy("SYSTEM")
                    .createdByName("System Migration")
                    .build();

            roleRepository.save(tenantRole);
            log.info("[Tenant: {}] Created role: {} ({})", tenantId, tenantRole.getRoleName(), tenantRole.getRoleId());
        }

        log.info("[Tenant: {}] Seeded {} default roles", tenantId, systemRoles.size());
    }

    // ===== SYSTEM ROLE CREATION METHODS =====

    private void createSystemAdministratorRole() {
        String roleId = "ROLE-00001";  // Fixed ID for system admin

        Role role = Role.builder()
                .roleId(roleId)
                .tenantId(null)  // System role, not tenant-specific
                .isSystemRole(true)
                .roleName("System Administrator")
                .description("Full system access with all administrative capabilities")
                .level(0)
                .modulePermissions(createAdminModulePermissions())
                .permissions(Role.RolePermissions.builder()
                        .dataVisibility("ALL")
                        .canManageUsers(true)
                        .canManageRoles(true)
                        .canManageProfiles(true)
                        .canViewSetup(true)
                        .canManageSharing(true)
                        .canViewAllData(true)
                        .canModifyAllData(true)
                        .canViewAuditLog(true)
                        .canExportData(true)
                        .canImportData(true)
                        .customPermissions(new ArrayList<>())
                        .build())
                .isActive(true)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy("SYSTEM")
                .createdByName("System Migration")
                .build();

        roleRepository.save(role);
        log.info("Created system role: System Administrator ({})", roleId);
    }

    private void createSalesManagerRole() {
        String roleId = "ROLE-00002";  // Fixed ID for sales manager

        Role role = Role.builder()
                .roleId(roleId)
                .tenantId(null)
                .isSystemRole(true)
                .roleName("Sales Manager")
                .description("Manage sales team with access to team data and analytics")
                .parentRoleId("ROLE-00001")
                .parentRoleName("System Administrator")
                .level(1)
                .modulePermissions(createManagerModulePermissions())
                .permissions(Role.RolePermissions.builder()
                        .dataVisibility("SUBORDINATES")
                        .canManageUsers(false)
                        .canManageRoles(false)
                        .canManageProfiles(false)
                        .canViewSetup(false)
                        .canManageSharing(false)
                        .canViewAllData(false)
                        .canModifyAllData(false)
                        .canViewAuditLog(false)
                        .canExportData(true)
                        .canImportData(true)
                        .customPermissions(new ArrayList<>())
                        .build())
                .isActive(true)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy("SYSTEM")
                .createdByName("System Migration")
                .build();

        roleRepository.save(role);
        log.info("Created system role: Sales Manager ({})", roleId);
    }

    private void createSalesRepresentativeRole() {
        String roleId = "ROLE-00003";  // Fixed ID for sales rep

        Role role = Role.builder()
                .roleId(roleId)
                .tenantId(null)
                .isSystemRole(true)
                .roleName("Sales Representative")
                .description("Standard sales user with access to own data")
                .parentRoleId("ROLE-00002")
                .parentRoleName("Sales Manager")
                .level(2)
                .modulePermissions(createSalesRepModulePermissions())
                .permissions(Role.RolePermissions.builder()
                        .dataVisibility("OWN")
                        .canManageUsers(false)
                        .canManageRoles(false)
                        .canManageProfiles(false)
                        .canViewSetup(false)
                        .canManageSharing(false)
                        .canViewAllData(false)
                        .canModifyAllData(false)
                        .canViewAuditLog(false)
                        .canExportData(false)
                        .canImportData(false)
                        .customPermissions(new ArrayList<>())
                        .build())
                .isActive(true)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy("SYSTEM")
                .createdByName("System Migration")
                .build();

        roleRepository.save(role);
        log.info("Created system role: Sales Representative ({})", roleId);
    }

    private void createReadOnlyUserRole() {
        String roleId = "ROLE-00004";  // Fixed ID for read-only

        Role role = Role.builder()
                .roleId(roleId)
                .tenantId(null)
                .isSystemRole(true)
                .roleName("Read-Only User")
                .description("View-only access with no create/edit/delete capabilities")
                .level(3)
                .modulePermissions(createReadOnlyModulePermissions())
                .permissions(Role.RolePermissions.builder()
                        .dataVisibility("OWN")
                        .canManageUsers(false)
                        .canManageRoles(false)
                        .canManageProfiles(false)
                        .canViewSetup(false)
                        .canManageSharing(false)
                        .canViewAllData(false)
                        .canModifyAllData(false)
                        .canViewAuditLog(false)
                        .canExportData(false)
                        .canImportData(false)
                        .customPermissions(new ArrayList<>())
                        .build())
                .isActive(true)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy("SYSTEM")
                .createdByName("System Migration")
                .build();

        roleRepository.save(role);
        log.info("Created system role: Read-Only User ({})", roleId);
    }

    // ===== MODULE PERMISSION BUILDERS =====

    private List<Role.ModulePermission> createAdminModulePermissions() {
        return Arrays.asList(
                Role.ModulePermission.builder()
                        .moduleName("CRM")
                        .displayName("Customer Management")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/leads", "/contacts", "/accounts", "/opportunities"))
                        .description("Manage customer relationships, leads, and opportunities")
                        .build(),
                Role.ModulePermission.builder()
                        .moduleName("ADMINISTRATION")
                        .displayName("Admin Panel")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/admin/users", "/admin/roles", "/admin/products", "/settings"))
                        .description("User management, roles, and system settings")
                        .build(),
                Role.ModulePermission.builder()
                        .moduleName("ANALYTICS")
                        .displayName("Analytics & Reports")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/dashboard", "/analytics"))
                        .description("View dashboards, reports, and analytics")
                        .build(),
                Role.ModulePermission.builder()
                        .moduleName("PRODUCTS")
                        .displayName("Product Management")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/products", "/catalog", "/proposals"))
                        .description("Manage products, catalog, and proposals")
                        .build(),
                Role.ModulePermission.builder()
                        .moduleName("ACTIVITIES")
                        .displayName("Activities")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/activities", "/user-activities"))
                        .description("Track and manage activities")
                        .build()
        );
    }

    private List<Role.ModulePermission> createManagerModulePermissions() {
        return Arrays.asList(
                Role.ModulePermission.builder()
                        .moduleName("CRM")
                        .displayName("Customer Management")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/leads", "/contacts", "/accounts", "/opportunities"))
                        .description("Manage customer relationships, leads, and opportunities")
                        .build(),
                Role.ModulePermission.builder()
                        .moduleName("ADMINISTRATION")
                        .displayName("Admin Panel")
                        .canAccess(false)  // Managers can't access admin
                        .includedPaths(Arrays.asList("/admin/users", "/admin/roles", "/admin/products", "/settings"))
                        .description("User management, roles, and system settings")
                        .build(),
                Role.ModulePermission.builder()
                        .moduleName("ANALYTICS")
                        .displayName("Analytics & Reports")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/dashboard", "/analytics"))
                        .description("View dashboards, reports, and analytics")
                        .build(),
                Role.ModulePermission.builder()
                        .moduleName("PRODUCTS")
                        .displayName("Product Management")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/products", "/catalog", "/proposals"))
                        .description("Manage products, catalog, and proposals")
                        .build(),
                Role.ModulePermission.builder()
                        .moduleName("ACTIVITIES")
                        .displayName("Activities")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/activities", "/user-activities"))
                        .description("Track and manage activities")
                        .build()
        );
    }

    private List<Role.ModulePermission> createSalesRepModulePermissions() {
        return Arrays.asList(
                Role.ModulePermission.builder()
                        .moduleName("CRM")
                        .displayName("Customer Management")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/leads", "/contacts", "/accounts", "/opportunities"))
                        .description("Manage customer relationships, leads, and opportunities")
                        .build(),
                Role.ModulePermission.builder()
                        .moduleName("ADMINISTRATION")
                        .displayName("Admin Panel")
                        .canAccess(false)  // Sales reps can't access admin
                        .includedPaths(Arrays.asList("/admin/users", "/admin/roles", "/admin/products", "/settings"))
                        .description("User management, roles, and system settings")
                        .build(),
                Role.ModulePermission.builder()
                        .moduleName("ANALYTICS")
                        .displayName("Analytics & Reports")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/dashboard", "/analytics"))
                        .description("View dashboards, reports, and analytics")
                        .build(),
                Role.ModulePermission.builder()
                        .moduleName("PRODUCTS")
                        .displayName("Product Management")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/products", "/catalog", "/proposals"))
                        .description("Manage products, catalog, and proposals")
                        .build(),
                Role.ModulePermission.builder()
                        .moduleName("ACTIVITIES")
                        .displayName("Activities")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/activities", "/user-activities"))
                        .description("Track and manage activities")
                        .build()
        );
    }

    private List<Role.ModulePermission> createReadOnlyModulePermissions() {
        return Arrays.asList(
                Role.ModulePermission.builder()
                        .moduleName("CRM")
                        .displayName("Customer Management")
                        .canAccess(true)  // Can view CRM data
                        .includedPaths(Arrays.asList("/leads", "/contacts", "/accounts", "/opportunities"))
                        .description("Manage customer relationships, leads, and opportunities")
                        .build(),
                Role.ModulePermission.builder()
                        .moduleName("ADMINISTRATION")
                        .displayName("Admin Panel")
                        .canAccess(false)
                        .includedPaths(Arrays.asList("/admin/users", "/admin/roles", "/admin/products", "/settings"))
                        .description("User management, roles, and system settings")
                        .build(),
                Role.ModulePermission.builder()
                        .moduleName("ANALYTICS")
                        .displayName("Analytics & Reports")
                        .canAccess(true)  // Can view analytics
                        .includedPaths(Arrays.asList("/dashboard", "/analytics"))
                        .description("View dashboards, reports, and analytics")
                        .build(),
                Role.ModulePermission.builder()
                        .moduleName("PRODUCTS")
                        .displayName("Product Management")
                        .canAccess(true)  // Can view products
                        .includedPaths(Arrays.asList("/products", "/catalog", "/proposals"))
                        .description("Manage products, catalog, and proposals")
                        .build(),
                Role.ModulePermission.builder()
                        .moduleName("ACTIVITIES")
                        .displayName("Activities")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/activities", "/user-activities"))
                        .description("Track and manage activities")
                        .build()
        );
    }
}
