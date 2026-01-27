import { api } from "./api-client";

/**
 * Unified User Role Enum - matches backend UserRole enum
 */
export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  SALES_REP = "SALES_REP",
  USER = "USER",
}

export interface CurrentUser {
  id: string;
  userId: string;
  username: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  title?: string;
  department?: string;

  // Unified role enum
  userRole: UserRole;

  // Hierarchical RBAC (optional, for advanced permissions)
  roleId?: string;
  roleName?: string;
  profileId?: string;
  profileName?: string;

  managerId?: string;
  managerName?: string;
  status: string;
  lastLoginAt?: string;
}

export const meService = {
  async getCurrentUser(): Promise<CurrentUser> {
    return api.get("/me");
  },
};
