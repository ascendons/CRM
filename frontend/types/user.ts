export interface UserProfile {
  firstName: string;
  lastName: string;
  fullName: string;
  title?: string;
  department?: string;
  phone?: string;
  mobilePhone?: string;
  avatar?: string;
}

export interface UserSettings {
  timeZone: string;
  language: string;
  dateFormat: string;
  currency: string;
  emailNotifications: boolean;
  desktopNotifications: boolean;
}

export interface UserSecurity {
  twoFactorEnabled: boolean;
  allowedIPs?: string[];
  lastLoginAt?: string;
  lastLoginIP?: string;
  failedLoginAttempts: number;
  lockedUntil?: string;
}

export interface UserResponse {
  id: string;
  userId: string;
  username: string;
  email: string;
  passwordLastChanged: string;
  passwordExpiresAt: string;
  profile: UserProfile;
  roleId: string;
  roleName?: string;
  profileId: string;
  profileName?: string;
  managerId?: string;
  managerName?: string;
  teamId?: string;
  teamName?: string;
  territoryId?: string;
  territoryName?: string;
  settings: UserSettings;
  security: UserSecurity;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  deactivationReason?: string;
  createdAt: string;
  createdBy: string;
  createdByName?: string;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
  lastModifiedByName?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  title?: string;
  department?: string;
  phone?: string;
  mobilePhone?: string;
  roleId: string;
  profileId: string;
  managerId?: string;
  teamId?: string;
  territoryId?: string;
  timeZone?: string;
  language?: string;
  dateFormat?: string;
  currency?: string;
  emailNotifications?: boolean;
  desktopNotifications?: boolean;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  department?: string;
  phone?: string;
  mobilePhone?: string;
  avatar?: string;
  roleId?: string;
  profileId?: string;
  managerId?: string;
  teamId?: string;
  territoryId?: string;
  timeZone?: string;
  language?: string;
  dateFormat?: string;
  currency?: string;
  emailNotifications?: boolean;
  desktopNotifications?: boolean;
}

// Helper functions
export function getUserDisplayName(user: UserResponse): string {
  return user.profile?.fullName || user.username;
}

export function getUserStatusColor(isActive: boolean): string {
  return isActive ? "text-green-600" : "text-gray-400";
}

export function getUserStatusBadge(isActive: boolean): string {
  return isActive
    ? "bg-green-100 text-green-800"
    : "bg-gray-100 text-gray-800";
}

export function isPasswordExpiringSoon(expiresAt: string): boolean {
  const daysUntilExpiry = Math.floor(
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
}

export function isPasswordExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() < Date.now();
}
