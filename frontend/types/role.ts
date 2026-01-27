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
