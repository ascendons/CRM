import type { RoleResponse } from "@/types/role";

/**
 * Predefined roles matching backend PredefinedRoles.java
 * These are hardcoded and do not come from the database
 */

export const PREDEFINED_ROLES: RoleResponse[] = [
  {
    id: "ROLE-00001",
    roleId: "ROLE-00001",
    roleName: "System Administrator",
    description: "Full system access with all administrative privileges",
    parentRoleId: undefined,
    parentRoleName: undefined,
    level: 0,
    childRoleIds: ["ROLE-00002"],
    permissions: {
      dataVisibility: "ALL",
      canManageUsers: true,
      canManageRoles: true,
      canManageProfiles: true,
      canViewSetup: true,
      canManageSharing: true,
      canViewAllData: true,
      canModifyAllData: true,
      canViewAuditLog: true,
      canExportData: true,
      canImportData: true,
      customPermissions: {},
    },
    isActive: true,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    createdBy: "SYSTEM",
    createdByName: "System",
    lastModifiedAt: new Date().toISOString(),
    lastModifiedBy: "SYSTEM",
    lastModifiedByName: "System",
  },
  {
    id: "ROLE-00002",
    roleId: "ROLE-00002",
    roleName: "Sales Manager",
    description: "Manages sales team with access to subordinate data",
    parentRoleId: "ROLE-00001",
    parentRoleName: "System Administrator",
    level: 1,
    childRoleIds: ["ROLE-00003"],
    permissions: {
      dataVisibility: "SUBORDINATES",
      canManageUsers: false,
      canManageRoles: false,
      canManageProfiles: false,
      canViewSetup: false,
      canManageSharing: false,
      canViewAllData: false,
      canModifyAllData: false,
      canViewAuditLog: false,
      canExportData: true,
      canImportData: true,
      customPermissions: {},
    },
    isActive: true,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    createdBy: "SYSTEM",
    createdByName: "System",
    lastModifiedAt: new Date().toISOString(),
    lastModifiedBy: "SYSTEM",
    lastModifiedByName: "System",
  },
  {
    id: "ROLE-00003",
    roleId: "ROLE-00003",
    roleName: "Sales Representative",
    description: "Standard sales user with access to own data",
    parentRoleId: "ROLE-00002",
    parentRoleName: "Sales Manager",
    level: 2,
    childRoleIds: [],
    permissions: {
      dataVisibility: "OWN",
      canManageUsers: false,
      canManageRoles: false,
      canManageProfiles: false,
      canViewSetup: false,
      canManageSharing: false,
      canViewAllData: false,
      canModifyAllData: false,
      canViewAuditLog: false,
      canExportData: false,
      canImportData: false,
      customPermissions: {},
    },
    isActive: true,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    createdBy: "SYSTEM",
    createdByName: "System",
    lastModifiedAt: new Date().toISOString(),
    lastModifiedBy: "SYSTEM",
    lastModifiedByName: "System",
  },
  {
    id: "ROLE-00004",
    roleId: "ROLE-00004",
    roleName: "Read Only User",
    description: "View-only access to own data",
    parentRoleId: undefined,
    parentRoleName: undefined,
    level: 0,
    childRoleIds: [],
    permissions: {
      dataVisibility: "OWN",
      canManageUsers: false,
      canManageRoles: false,
      canManageProfiles: false,
      canViewSetup: false,
      canManageSharing: false,
      canViewAllData: false,
      canModifyAllData: false,
      canViewAuditLog: false,
      canExportData: false,
      canImportData: false,
      customPermissions: {},
    },
    isActive: true,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    createdBy: "SYSTEM",
    createdByName: "System",
    lastModifiedAt: new Date().toISOString(),
    lastModifiedBy: "SYSTEM",
    lastModifiedByName: "System",
  },
];

export function getAllRoles(): RoleResponse[] {
  return PREDEFINED_ROLES;
}

export function getActiveRoles(): RoleResponse[] {
  return PREDEFINED_ROLES.filter((role) => role.isActive && !role.isDeleted);
}

export function getRoleById(id: string): RoleResponse | undefined {
  return PREDEFINED_ROLES.find((role) => role.id === id || role.roleId === id);
}

export function getRoleByName(name: string): RoleResponse | undefined {
  return PREDEFINED_ROLES.find((role) => role.roleName.toLowerCase() === name.toLowerCase());
}

export function getRootRoles(): RoleResponse[] {
  return PREDEFINED_ROLES.filter((role) => !role.parentRoleId);
}

export function getChildRoles(parentRoleId: string): RoleResponse[] {
  return PREDEFINED_ROLES.filter((role) => role.parentRoleId === parentRoleId);
}

export function searchRoles(query: string): RoleResponse[] {
  const lowerQuery = query.toLowerCase();
  return PREDEFINED_ROLES.filter(
    (role) =>
      role.roleName.toLowerCase().includes(lowerQuery) ||
      (role.description && role.description.toLowerCase().includes(lowerQuery))
  );
}
