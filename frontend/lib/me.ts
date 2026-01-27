import { api } from "./api-client";

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
