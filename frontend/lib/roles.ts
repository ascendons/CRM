import { api } from "./api-client";
import type { RoleResponse, CreateRoleRequest, UpdateRoleRequest } from "@/types/role";
import * as PredefinedRoles from "./predefined-roles";

/**
 * Roles service using predefined enums instead of database
 * All read operations use local predefined roles
 * Write operations are disabled (roles are hardcoded)
 */
export const rolesService = {
  async createRole(data: CreateRoleRequest): Promise<RoleResponse> {
    // Roles are predefined - cannot create new roles
    throw new Error("Cannot create roles - roles are predefined in code");
  },

  async getAllRoles(activeOnly = false): Promise<RoleResponse[]> {
    // Use predefined roles instead of API call
    return Promise.resolve(activeOnly ? PredefinedRoles.getActiveRoles() : PredefinedRoles.getAllRoles());
  },

  async getRoleById(id: string): Promise<RoleResponse> {
    // Use predefined roles instead of API call
    const role = PredefinedRoles.getRoleById(id);
    if (!role) {
      throw new Error(`Role not found with id: ${id}`);
    }
    return Promise.resolve(role);
  },

  async getRoleByRoleId(roleId: string): Promise<RoleResponse> {
    // Use predefined roles instead of API call
    const role = PredefinedRoles.getRoleById(roleId);
    if (!role) {
      throw new Error(`Role not found with roleId: ${roleId}`);
    }
    return Promise.resolve(role);
  },

  async getRootRoles(): Promise<RoleResponse[]> {
    // Use predefined roles instead of API call
    return Promise.resolve(PredefinedRoles.getRootRoles());
  },

  async getChildRoles(parentRoleId: string): Promise<RoleResponse[]> {
    // Use predefined roles instead of API call
    return Promise.resolve(PredefinedRoles.getChildRoles(parentRoleId));
  },

  async searchRoles(query: string): Promise<RoleResponse[]> {
    // Use predefined roles instead of API call
    return Promise.resolve(PredefinedRoles.searchRoles(query));
  },

  async updateRole(id: string, data: UpdateRoleRequest): Promise<RoleResponse> {
    // Roles are predefined - cannot update roles
    throw new Error("Cannot update roles - roles are predefined in code");
  },

  async deleteRole(id: string): Promise<void> {
    // Roles are predefined - cannot delete roles
    throw new Error("Cannot delete roles - roles are predefined in code");
  },
};
