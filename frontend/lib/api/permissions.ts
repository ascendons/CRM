import { api } from "../api-client";

export interface PermissionOverride {
  objectName: string;
  action: string;
  granted: boolean;
  grantedBy?: string;
  grantedByName?: string;
  grantedAt?: string;
  reason?: string;
  expiresAt?: string;
}

export interface PermissionDetail {
  action: string;
  granted: boolean;
  source: "PROFILE" | "USER_GRANT" | "USER_DENY";
  isOverride: boolean;
}

export interface ObjectPermissions {
  objectName: string;
  displayName: string;
  permissions: Record<string, PermissionDetail>;
}

export interface ModulePermissions {
  moduleName: string;
  displayName: string;
  objects: ObjectPermissions[];
}

export interface EffectivePermissionsResponse {
  userId: string;
  userName: string;
  userEmail: string;
  profileId: string;
  profileName: string;
  modules: ModulePermissions[];
  overrides: PermissionOverride[];
}

export interface GrantPermissionRequest {
  objectName: string;
  action: string;
  reason?: string;
  expiresAt?: string;
}

export interface RevokePermissionRequest {
  objectName: string;
  action: string;
  reason?: string;
}

export interface BulkUpdatePermissionsRequest {
  grants?: GrantPermissionRequest[];
  revokes?: RevokePermissionRequest[];
  reason?: string;
}

export const permissionsApi = {
  // Get effective permissions (profile + overrides)
  getEffectivePermissions: (userId: string) =>
    api.get<EffectivePermissionsResponse>(`/users/${userId}/permissions/effective`),

  // Get user-specific overrides only
  getUserOverrides: (userId: string) =>
    api.get<PermissionOverride[]>(`/users/${userId}/permissions/overrides`),

  // Grant permission to user
  grantPermission: (userId: string, data: GrantPermissionRequest) =>
    api.post(`/users/${userId}/permissions/grant`, data),

  // Revoke user-specific permission
  revokePermission: (userId: string, data: RevokePermissionRequest) =>
    api.post(`/users/${userId}/permissions/revoke`, data),

  // Bulk update permissions
  bulkUpdatePermissions: (userId: string, data: BulkUpdatePermissionsRequest) =>
    api.put(`/users/${userId}/permissions/bulk`, data),
};
