export interface ObjectPermission {
  objectName: string;
  canCreate: boolean;
  canRead: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  canModifyAll: boolean;
}

export interface FieldPermission {
  objectName: string;
  fieldName: string;
  canRead: boolean;
  canEdit: boolean;
  isHidden: boolean;
  isEncrypted: boolean;
}

export interface SystemPermissions {
  canAccessAPI: boolean;
  apiRateLimit: number;
  canAccessMobileApp: boolean;
  canAccessReports: boolean;
  canAccessDashboards: boolean;
  canBulkUpdate: boolean;
  canBulkDelete: boolean;
  canMassEmail: boolean;
  canBypassValidation: boolean;
  canRunApex: boolean;
}

export interface ProfileResponse {
  id: string;
  profileId: string;
  profileName: string;
  description?: string;
  objectPermissions: ObjectPermission[];
  fieldPermissions: FieldPermission[];
  systemPermissions: SystemPermissions;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  createdBy: string;
  createdByName?: string;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
  lastModifiedByName?: string;
}

export interface CreateProfileRequest {
  profileName: string;
  description?: string;
  objectPermissions?: Partial<ObjectPermission>[];
  fieldPermissions?: Partial<FieldPermission>[];
  systemPermissions?: Partial<SystemPermissions>;
}

export interface UpdateProfileRequest {
  profileName?: string;
  description?: string;
  objectPermissions?: Partial<ObjectPermission>[];
  fieldPermissions?: Partial<FieldPermission>[];
  systemPermissions?: Partial<SystemPermissions>;
}
