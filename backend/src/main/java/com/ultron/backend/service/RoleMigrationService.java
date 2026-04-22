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

    /**
     * Patch existing roles in the database with missing Field Service module
     */
    public void patchMissingModules() {
        log.info("Starting Patch: Missing Field Service Module");
        List<Role> allRoles = roleRepository.findByIsDeletedFalse();
        int patchCount = 0;

        for (Role role : allRoles) {
            boolean modified = false;
            List<Role.ModulePermission> modules = role.getModulePermissions();
            if (modules == null) {
                modules = new ArrayList<>();
                role.setModulePermissions(modules);
            }

            boolean fieldServiceExists = modules.stream()
                    .anyMatch(m -> m.getModuleName().equalsIgnoreCase("FIELD_SERVICE"));
            if (!fieldServiceExists) {
                modules.add(Role.ModulePermission.builder()
                        .moduleName("FIELD_SERVICE")
                        .displayName("Field Service")
                        .canAccess(true)
                        .includedPaths(Arrays.asList(
                                "/assets/**", "/contracts/**", "/service-requests/**",
                                "/work-orders/**", "/dispatch/**", "/geo/**",
                                "/skill-matrix/**", "/parts-requests/**"))
                        .description("Manage assets, contracts, work orders, dispatch, and field operations")
                        .build());
                modified = true;
            }

            boolean procurementExists = modules.stream()
                    .anyMatch(m -> m.getModuleName().equalsIgnoreCase("PROCUREMENT"));
            if (!procurementExists) {
                modules.add(Role.ModulePermission.builder()
                        .moduleName("PROCUREMENT")
                        .displayName("Procurement")
                        .canAccess(true)
                        .includedPaths(Arrays.asList(
                                "/vendors/**", "/procurement/**"))
                        .description("Vendor management, RFQ, GRN, rate contracts, purchase orders")
                        .build());
                modified = true;
            }

            boolean dealerExists = modules.stream()
                    .anyMatch(m -> m.getModuleName().equalsIgnoreCase("DEALER_MANAGEMENT"));
            if (!dealerExists) {
                modules.add(Role.ModulePermission.builder()
                        .moduleName("DEALER_MANAGEMENT")
                        .displayName("Dealer Management")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/dealers/**"))
                        .description("Dealer and distributor management")
                        .build());
                modified = true;
            }

            boolean analyticsExists = modules.stream()
                    .anyMatch(m -> m.getModuleName().equalsIgnoreCase("SERVICE_ANALYTICS"));
            if (!analyticsExists) {
                modules.add(Role.ModulePermission.builder()
                        .moduleName("SERVICE_ANALYTICS")
                        .displayName("Service Analytics")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/analytics/service/**"))
                        .description("Service KPIs and inventory analytics dashboards")
                        .build());
                modified = true;
            }

            boolean escalationExists = modules.stream()
                    .anyMatch(m -> m.getModuleName().equalsIgnoreCase("ESCALATION"));
            if (!escalationExists) {
                modules.add(Role.ModulePermission.builder()
                        .moduleName("ESCALATION")
                        .displayName("Escalation Management")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/admin/settings/escalation/**"))
                        .description("Escalation rules and log management")
                        .build());
                modified = true;
            }

            boolean projectsExists = modules.stream()
                    .anyMatch(m -> m.getModuleName().equalsIgnoreCase("PROJECTS"));
            if (!projectsExists) {
                modules.add(Role.ModulePermission.builder()
                        .moduleName("PROJECTS")
                        .displayName("Project Management")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/projects/**", "/timesheets/**"))
                        .description("Manage projects, tasks, time tracking, and workload")
                        .build());
                modified = true;
            }

            boolean kbExists = modules.stream()
                    .anyMatch(m -> m.getModuleName().equalsIgnoreCase("KNOWLEDGE_BASE"));
            if (!kbExists) {
                modules.add(Role.ModulePermission.builder()
                        .moduleName("KNOWLEDGE_BASE")
                        .displayName("Knowledge Base")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/knowledge-base/**"))
                        .description("Internal knowledge base and documentation")
                        .build());
                modified = true;
            }

            boolean webFormsExists = modules.stream()
                    .anyMatch(m -> m.getModuleName().equalsIgnoreCase("WEB_FORMS"));
            if (!webFormsExists) {
                modules.add(Role.ModulePermission.builder()
                        .moduleName("WEB_FORMS")
                        .displayName("Web Forms & Landing Pages")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/marketing/**"))
                        .description("Web form and landing page builder for lead capture")
                        .build());
                modified = true;
            }

            boolean performanceExists = modules.stream()
                    .anyMatch(m -> m.getModuleName().equalsIgnoreCase("PERFORMANCE_REVIEWS"));
            if (!performanceExists) {
                modules.add(Role.ModulePermission.builder()
                        .moduleName("PERFORMANCE_REVIEWS")
                        .displayName("Performance Reviews & OKRs")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/hr/performance/**", "/hr/okrs/**"))
                        .description("Performance review cycles, competency ratings, and OKR tracking")
                        .build());
                modified = true;
            }

            boolean onboardingExists = modules.stream()
                    .anyMatch(m -> m.getModuleName().equalsIgnoreCase("ONBOARDING"));
            if (!onboardingExists) {
                modules.add(Role.ModulePermission.builder()
                        .moduleName("ONBOARDING")
                        .displayName("Employee Onboarding")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/hr/onboarding/**"))
                        .description("Employee onboarding and offboarding workflows")
                        .build());
                modified = true;
            }

            boolean driveExists = modules.stream()
                    .anyMatch(m -> m.getModuleName().equalsIgnoreCase("DRIVE"));
            if (!driveExists) {
                modules.add(Role.ModulePermission.builder()
                        .moduleName("DRIVE")
                        .displayName("Document Drive")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/drive/**"))
                        .description("Document storage and collaboration")
                        .build());
                modified = true;
            }

            boolean feedExists = modules.stream()
                    .anyMatch(m -> m.getModuleName().equalsIgnoreCase("FEED"));
            if (!feedExists) {
                modules.add(Role.ModulePermission.builder()
                        .moduleName("FEED")
                        .displayName("Activity Feed")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/feed/**"))
                        .description("Company activity feed and announcements")
                        .build());
                modified = true;
            }

            boolean surveysExists = modules.stream()
                    .anyMatch(m -> m.getModuleName().equalsIgnoreCase("SURVEYS"));
            if (!surveysExists) {
                modules.add(Role.ModulePermission.builder()
                        .moduleName("SURVEYS")
                        .displayName("Surveys & Polls")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/surveys/**"))
                        .description("Create and manage employee surveys and polls")
                        .build());
                modified = true;
            }

            boolean reportsExists = modules.stream()
                    .anyMatch(m -> m.getModuleName().equalsIgnoreCase("REPORTS"));
            if (!reportsExists) {
                modules.add(Role.ModulePermission.builder()
                        .moduleName("REPORTS")
                        .displayName("Custom Reports")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/reports/**"))
                        .description("Custom report builder and saved reports")
                        .build());
                modified = true;
            }

            boolean esignExists = modules.stream()
                    .anyMatch(m -> m.getModuleName().equalsIgnoreCase("ESIGNATURE"));
            if (!esignExists) {
                modules.add(Role.ModulePermission.builder()
                        .moduleName("ESIGNATURE")
                        .displayName("E-Signature")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/esignature/**"))
                        .description("Electronic signature requests for documents")
                        .build());
                modified = true;
            }

            boolean aiExists = modules.stream()
                    .anyMatch(m -> m.getModuleName().equalsIgnoreCase("AI_COPILOT"));
            if (!aiExists) {
                modules.add(Role.ModulePermission.builder()
                        .moduleName("AI_COPILOT")
                        .displayName("AI CoPilot")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/ai/**"))
                        .description("AI-powered suggestions and automation")
                        .build());
                modified = true;
            }

            if (modified) {
                roleRepository.save(role);
                patchCount++;
                log.info("Patched module permissions for role: {}", role.getRoleName());
            }
        }
        log.info("Completed Patch: Updated {} roles", patchCount);
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
                        .build(),
                Role.ModulePermission.builder()
                        .moduleName("FIELD_SERVICE")
                        .displayName("Field Service")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/assets/**", "/contracts/**", "/service-requests/**", "/work-orders/**"))
                        .description("Manage assets, contracts, and field operations")
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
                        .build(),
                Role.ModulePermission.builder()
                        .moduleName("FIELD_SERVICE")
                        .displayName("Field Service")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/assets/**", "/contracts/**", "/service-requests/**", "/work-orders/**"))
                        .description("Manage assets, contracts, and field operations")
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
                        .build(),
                Role.ModulePermission.builder()
                        .moduleName("FIELD_SERVICE")
                        .displayName("Field Service")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/assets/**", "/contracts/**", "/service-requests/**", "/work-orders/**"))
                        .description("Manage assets, contracts, and field operations")
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
                        .build(),
                Role.ModulePermission.builder()
                        .moduleName("FIELD_SERVICE")
                        .displayName("Field Service")
                        .canAccess(true)
                        .includedPaths(Arrays.asList("/assets/**", "/contracts/**", "/service-requests/**", "/work-orders/**"))
                        .description("Manage assets, contracts, and field operations")
                        .build()
        );
    }
}
