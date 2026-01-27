import { api } from "./api-client";
import type { RoleResponse, CreateRoleRequest, UpdateRoleRequest } from "@/types/role";

export const rolesService = {
  async createRole(data: CreateRoleRequest): Promise<RoleResponse> {
    return api.post("/roles", data);
  },

  async getAllRoles(activeOnly = false): Promise<RoleResponse[]> {
    return api.get(`/roles?activeOnly=${activeOnly}`);
  },

  async getRoleById(id: string): Promise<RoleResponse> {
    return api.get(`/roles/${id}`);
  },

  async getRoleByRoleId(roleId: string): Promise<RoleResponse> {
    return api.get(`/roles/code/${roleId}`);
  },

  async getRootRoles(): Promise<RoleResponse[]> {
    return api.get("/roles/root");
  },

  async getChildRoles(parentRoleId: string): Promise<RoleResponse[]> {
    return api.get(`/roles/children/${parentRoleId}`);
  },

  async searchRoles(query: string): Promise<RoleResponse[]> {
    return api.get(`/roles/search?query=${encodeURIComponent(query)}`);
  },

  async updateRole(id: string, data: UpdateRoleRequest): Promise<RoleResponse> {
    return api.put(`/roles/${id}`, data);
  },

  async deleteRole(id: string): Promise<void> {
    return api.delete(`/roles/${id}`);
  },
};
