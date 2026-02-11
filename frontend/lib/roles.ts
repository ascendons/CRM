import { api } from "./api-client";
import type {
  RoleResponse,
  CreateRoleRequest,
  UpdateRoleRequest,
  ModulePermissionResponse,
  UpdateModulePermissionsRequest,
  ModuleDefinitionResponse,
} from "@/types/role";

/**
 * Roles service for dynamic RBAC (database-driven roles)
 * All operations now use the backend API
 */
export const rolesService = {
  /**
   * Create a new role
   */
  async createRole(data: CreateRoleRequest): Promise<RoleResponse> {
    return api.post<RoleResponse>("/roles", data);
  },

  /**
   * Get all roles for current tenant
   */
  async getAllRoles(activeOnly = false): Promise<RoleResponse[]> {
    return api.get<RoleResponse[]>(`/roles?activeOnly=${activeOnly}`);
  },

  /**
   * Get role by MongoDB ID
   */
  async getRoleById(id: string): Promise<RoleResponse> {
    return api.get<RoleResponse>(`/roles/${id}`);
  },

  /**
   * Get role by business roleId (ROLE-XXXXX)
   */
  async getRoleByRoleId(roleId: string): Promise<RoleResponse> {
    return api.get<RoleResponse>(`/roles/code/${roleId}`);
  },

  /**
   * Get root roles (no parent)
   */
  async getRootRoles(): Promise<RoleResponse[]> {
    return api.get<RoleResponse[]>("/roles/root");
  },

  /**
   * Get child roles for a parent role
   */
  async getChildRoles(parentRoleId: string): Promise<RoleResponse[]> {
    return api.get<RoleResponse[]>(`/roles/children/${parentRoleId}`);
  },

  /**
   * Search roles by name
   */
  async searchRoles(query: string): Promise<RoleResponse[]> {
    return api.get<RoleResponse[]>(`/roles/search?query=${encodeURIComponent(query)}`);
  },

  /**
   * Update role details
   */
  async updateRole(id: string, data: UpdateRoleRequest): Promise<RoleResponse> {
    return api.put<RoleResponse>(`/roles/${id}`, data);
  },

  /**
   * Delete role (soft delete)
   */
  async deleteRole(id: string): Promise<void> {
    return api.delete<void>(`/roles/${id}`);
  },

  // ===== MODULE PERMISSION METHODS (LEAN RBAC) =====

  /**
   * Get module permissions for a role
   */
  async getModulePermissions(roleId: string): Promise<ModulePermissionResponse[]> {
    return api.get<ModulePermissionResponse[]>(`/roles/${roleId}/modules`);
  },

  /**
   * Update module permissions for a role
   */
  async updateModulePermissions(
    roleId: string,
    permissions: UpdateModulePermissionsRequest
  ): Promise<void> {
    return api.put<void>(`/roles/${roleId}/modules`, permissions);
  },

  /**
   * Get available modules (for UI dropdowns)
   */
  async getAvailableModules(): Promise<ModuleDefinitionResponse[]> {
    return api.get<ModuleDefinitionResponse[]>("/roles/modules/available");
  },
};
