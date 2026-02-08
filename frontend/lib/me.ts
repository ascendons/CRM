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
  phone?: string;
  mobilePhone?: string;

  settings?: {
    timeZone?: string;
    language?: string;
    dateFormat?: string;
    currency?: string;
    emailNotifications?: boolean;
    desktopNotifications?: boolean;
  };
}

export const meService = {
  async getCurrentUser(): Promise<CurrentUser> {
    return api.get("/me");
  },

  async updateProfile(data: Partial<CurrentUser>): Promise<CurrentUser> {
    return api.put("/me/profile", data);
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    return api.put("/me/security/password", data);
  },

  async updateSettings(data: {
    timeZone?: string;
    language?: string;
    dateFormat?: string;
    currency?: string;
    emailNotifications?: boolean;
    desktopNotifications?: boolean;
  }): Promise<CurrentUser> {
    return api.put("/me/settings", data);
  }
};
