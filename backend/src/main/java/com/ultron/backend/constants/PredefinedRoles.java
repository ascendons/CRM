package com.ultron.backend.constants;

import com.ultron.backend.domain.entity.Role;
import com.ultron.backend.domain.enums.UserRole;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Predefined roles with hardcoded permissions.
 * These replace database-driven roles with code-based configuration.
 */
public class PredefinedRoles {

    public static final Role SYSTEM_ADMINISTRATOR = Role.builder()
            .id("ROLE-00001")
            .roleId("ROLE-00001")
            .roleName("System Administrator")
            .description("Full system access with all administrative privileges")
            .parentRoleId(null)
            .parentRoleName(null)
            .level(0)
            .childRoleIds(Arrays.asList("ROLE-00002"))
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
                    .customPermissions(Collections.emptyList())
                    .build())
            .isActive(true)
            .isDeleted(false)
            .createdAt(LocalDateTime.now())
            .createdBy("SYSTEM")
            .createdByName("System")
            .build();

    public static final Role SALES_MANAGER = Role.builder()
            .id("ROLE-00002")
            .roleId("ROLE-00002")
            .roleName("Sales Manager")
            .description("Manages sales team with access to subordinate data")
            .parentRoleId("ROLE-00001")
            .parentRoleName("System Administrator")
            .level(1)
            .childRoleIds(Arrays.asList("ROLE-00003"))
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
                    .customPermissions(Collections.emptyList())
                    .build())
            .isActive(true)
            .isDeleted(false)
            .createdAt(LocalDateTime.now())
            .createdBy("SYSTEM")
            .createdByName("System")
            .build();

    public static final Role SALES_REPRESENTATIVE = Role.builder()
            .id("ROLE-00003")
            .roleId("ROLE-00003")
            .roleName("Sales Representative")
            .description("Standard sales user with access to own data")
            .parentRoleId("ROLE-00002")
            .parentRoleName("Sales Manager")
            .level(2)
            .childRoleIds(Collections.emptyList())
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
                    .customPermissions(Collections.emptyList())
                    .build())
            .isActive(true)
            .isDeleted(false)
            .createdAt(LocalDateTime.now())
            .createdBy("SYSTEM")
            .createdByName("System")
            .build();

    public static final Role READ_ONLY_USER = Role.builder()
            .id("ROLE-00004")
            .roleId("ROLE-00004")
            .roleName("Read Only User")
            .description("View-only access to own data")
            .parentRoleId(null)
            .parentRoleName(null)
            .level(0)
            .childRoleIds(Collections.emptyList())
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
                    .customPermissions(Collections.emptyList())
                    .build())
            .isActive(true)
            .isDeleted(false)
            .createdAt(LocalDateTime.now())
            .createdBy("SYSTEM")
            .createdByName("System")
            .build();

    /**
     * Get all predefined roles
     */
    public static List<Role> getAllRoles() {
        return Arrays.asList(
                SYSTEM_ADMINISTRATOR,
                SALES_MANAGER,
                SALES_REPRESENTATIVE,
                READ_ONLY_USER
        );
    }

    /**
     * Get only active roles
     */
    public static List<Role> getActiveRoles() {
        return getAllRoles().stream()
                .filter(Role::getIsActive)
                .toList();
    }

    /**
     * Get role by ID
     */
    public static Role getRoleById(String id) {
        return getAllRoles().stream()
                .filter(role -> role.getId().equals(id) || role.getRoleId().equals(id))
                .findFirst()
                .orElse(null);
    }

    /**
     * Get role by name
     */
    public static Role getRoleByName(String name) {
        return getAllRoles().stream()
                .filter(role -> role.getRoleName().equalsIgnoreCase(name))
                .findFirst()
                .orElse(null);
    }

    /**
     * Get root roles (no parent)
     */
    public static List<Role> getRootRoles() {
        return getAllRoles().stream()
                .filter(role -> role.getParentRoleId() == null)
                .toList();
    }

    /**
     * Get child roles of a parent
     */
    public static List<Role> getChildRoles(String parentRoleId) {
        return getAllRoles().stream()
                .filter(role -> parentRoleId.equals(role.getParentRoleId()))
                .toList();
    }

    /**
     * Search roles by query
     */
    public static List<Role> searchRoles(String query) {
        String lowerQuery = query.toLowerCase();
        return getAllRoles().stream()
                .filter(role ->
                    role.getRoleName().toLowerCase().contains(lowerQuery) ||
                    (role.getDescription() != null && role.getDescription().toLowerCase().contains(lowerQuery))
                )
                .toList();
    }
}
