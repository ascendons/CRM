import { api } from "./api-client";
import type {
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
} from "@/types/user";

export const usersService = {
  /**
   * Create a new user
   */
  async createUser(data: CreateUserRequest): Promise<UserResponse> {
    return api.post("/users", data);
  },

  /**
   * Get all users
   * @param activeOnly - If true, only return active users
   */
  async getAllUsers(activeOnly: boolean = false): Promise<UserResponse[]> {
    const endpoint = activeOnly ? "/users?activeOnly=true" : "/users";
    return api.get(endpoint);
  },

  /**
   * Get active users only
   */
  async getActiveUsers(): Promise<UserResponse[]> {
    return this.getAllUsers(true);
  },

  /**
   * Get user by MongoDB ID
   */
  async getUserById(id: string): Promise<UserResponse> {
    return api.get(`/users/${id}`);
  },

  /**
   * Get user by business ID (USR-YYYY-MM-XXXXX)
   */
  async getUserByUserId(userId: string): Promise<UserResponse> {
    return api.get(`/users/code/${userId}`);
  },

  /**
   * Get users by role
   */
  async getUsersByRole(roleId: string): Promise<UserResponse[]> {
    return api.get(`/users/role/${roleId}`);
  },

  /**
   * Get subordinates of a manager
   */
  async getSubordinates(managerId: string): Promise<UserResponse[]> {
    return api.get(`/users/subordinates/${managerId}`);
  },

  /**
   * Search users by name, username, or email
   */
  async searchUsers(query: string): Promise<UserResponse[]> {
    return api.get(`/users/search?q=${encodeURIComponent(query)}`);
  },

  /**
   * Update user
   */
  async updateUser(
    id: string,
    data: UpdateUserRequest
  ): Promise<UserResponse> {
    return api.put(`/users/${id}`, data);
  },

  /**
   * Deactivate user
   * @param id - User MongoDB ID
   * @param reason - Optional reason for deactivation
   */
  async deactivateUser(id: string, reason?: string): Promise<void> {
    const url = reason
      ? `/users/${id}/deactivate?reason=${encodeURIComponent(reason)}`
      : `/users/${id}/deactivate`;
    return api.post(url, {});
  },

  /**
   * Activate user
   */
  async activateUser(id: string): Promise<void> {
    return api.post(`/users/${id}/activate`, {});
  },
};
