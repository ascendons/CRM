export interface RolePermissions {
  dataVisibility: "OWN" | "SUBORDINATES" | "ALL_USERS" | "ALL";
  canManageUsers: boolean;
  canManageRoles: boolean;
  canManageProfiles: boolean;
  canViewSetup: boolean;
  canManageSharing: boolean;
  canViewAllData: boolean;
  canModifyAllData: boolean;
  canViewAuditLog: boolean;
  canExportData: boolean;
  canImportData: boolean;
  customPermissions?: Record<string, boolean>;
}

export interface RoleResponse {
  id: string;
  roleId: string;
  roleName: string;
  description?: string;
  parentRoleId?: string;
  parentRoleName?: string;
  level: number;
  childRoleIds: string[];
  permissions: RolePermissions;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  createdBy: string;
  createdByName?: string;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
  lastModifiedByName?: string;
}

export interface CreateRoleRequest {
  roleName: string;
  description?: string;
  parentRoleId?: string;
  permissions?: Partial<RolePermissions>;
}

export interface UpdateRoleRequest {
  roleName?: string;
  description?: string;
  parentRoleId?: string;
  permissions?: Partial<RolePermissions>;
}

// ===== MODULE PERMISSION TYPES (LEAN RBAC) =====

export interface ModulePermissionResponse {
  moduleName: string;
  displayName: string;
  canAccess: boolean;
  includedPaths: string[];
  description?: string;
}

export interface ModulePermission {
  moduleName: string;
  displayName: string;
  canAccess: boolean;
  includedPaths?: string[];
  description?: string;
}

export interface UpdateModulePermissionsRequest {
  modulePermissions: ModulePermission[];
}

export interface ModuleDefinitionResponse {
  moduleName: string;
  displayName: string;
  includedPaths: string[];
  description: string;
  category: string;
}
