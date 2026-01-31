import type { ProfileResponse } from "@/types/profile";

/**
 * Predefined profiles matching backend PredefinedProfiles.java
 * These are hardcoded and do not come from the database
 */

const createFullAccessPermission = (objectName: string) => ({
  objectName,
  canCreate: true,
  canRead: true,
  canEdit: true,
  canDelete: true,
  canViewAll: true,
  canModifyAll: true,
});

const createStandardPermission = (objectName: string) => ({
  objectName,
  canCreate: true,
  canRead: true,
  canEdit: true,
  canDelete: true,
  canViewAll: false,
  canModifyAll: false,
});

const createReadOnlyPermission = (objectName: string) => ({
  objectName,
  canCreate: false,
  canRead: true,
  canEdit: false,
  canDelete: false,
  canViewAll: false,
  canModifyAll: false,
});

const createNoAccessPermission = (objectName: string) => ({
  objectName,
  canCreate: false,
  canRead: false,
  canEdit: false,
  canDelete: false,
  canViewAll: false,
  canModifyAll: false,
});

export const PREDEFINED_PROFILES: ProfileResponse[] = [
  {
    id: "PROFILE-00001",
    profileId: "PROFILE-00001",
    profileName: "System Administrator",
    description: "Full access to all objects and fields",
    objectPermissions: [
      createFullAccessPermission("USER"),
      createFullAccessPermission("ROLE"),
      createFullAccessPermission("PROFILE"),
      createFullAccessPermission("LEAD"),
      createFullAccessPermission("ACCOUNT"),
      createFullAccessPermission("CONTACT"),
      createFullAccessPermission("OPPORTUNITY"),
      createFullAccessPermission("ACTIVITY"),
    ],
    fieldPermissions: [],
    systemPermissions: {
      canAccessAPI: true,
      apiRateLimit: 10000,
      canAccessMobileApp: true,
      canAccessReports: true,
      canAccessDashboards: true,
      canBulkUpdate: true,
      canBulkDelete: true,
      canMassEmail: true,
      canBypassValidation: true,
      canRunApex: true,
    },
    isActive: true,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    createdBy: "SYSTEM",
    createdByName: "System",
    lastModifiedAt: new Date().toISOString(),
    lastModifiedBy: "SYSTEM",
    lastModifiedByName: "System",
  },
  {
    id: "PROFILE-00002",
    profileId: "PROFILE-00002",
    profileName: "Sales Manager",
    description: "Manage sales objects with team visibility",
    objectPermissions: [
      createReadOnlyPermission("USER"),
      createReadOnlyPermission("ROLE"),
      createReadOnlyPermission("PROFILE"),
      createFullAccessPermission("LEAD"),
      createFullAccessPermission("ACCOUNT"),
      createFullAccessPermission("CONTACT"),
      createFullAccessPermission("OPPORTUNITY"),
      createFullAccessPermission("ACTIVITY"),
    ],
    fieldPermissions: [],
    systemPermissions: {
      canAccessAPI: true,
      apiRateLimit: 5000,
      canAccessMobileApp: true,
      canAccessReports: true,
      canAccessDashboards: true,
      canBulkUpdate: true,
      canBulkDelete: false,
      canMassEmail: true,
      canBypassValidation: false,
      canRunApex: false,
    },
    isActive: true,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    createdBy: "SYSTEM",
    createdByName: "System",
    lastModifiedAt: new Date().toISOString(),
    lastModifiedBy: "SYSTEM",
    lastModifiedByName: "System",
  },
  {
    id: "PROFILE-00003",
    profileId: "PROFILE-00003",
    profileName: "Sales Representative",
    description: "Standard sales user access",
    objectPermissions: [
      createReadOnlyPermission("USER"),
      createNoAccessPermission("ROLE"),
      createNoAccessPermission("PROFILE"),
      createStandardPermission("LEAD"),
      createStandardPermission("ACCOUNT"),
      createStandardPermission("CONTACT"),
      createStandardPermission("OPPORTUNITY"),
      createStandardPermission("ACTIVITY"),
    ],
    fieldPermissions: [],
    systemPermissions: {
      canAccessAPI: true,
      apiRateLimit: 1000,
      canAccessMobileApp: true,
      canAccessReports: true,
      canAccessDashboards: true,
      canBulkUpdate: false,
      canBulkDelete: false,
      canMassEmail: false,
      canBypassValidation: false,
      canRunApex: false,
    },
    isActive: true,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    createdBy: "SYSTEM",
    createdByName: "System",
    lastModifiedAt: new Date().toISOString(),
    lastModifiedBy: "SYSTEM",
    lastModifiedByName: "System",
  },
  {
    id: "PROFILE-00004",
    profileId: "PROFILE-00004",
    profileName: "Read Only User",
    description: "View-only access to all objects",
    objectPermissions: [
      createReadOnlyPermission("USER"),
      createReadOnlyPermission("ROLE"),
      createReadOnlyPermission("PROFILE"),
      createReadOnlyPermission("LEAD"),
      createReadOnlyPermission("ACCOUNT"),
      createReadOnlyPermission("CONTACT"),
      createReadOnlyPermission("OPPORTUNITY"),
      createReadOnlyPermission("ACTIVITY"),
    ],
    fieldPermissions: [],
    systemPermissions: {
      canAccessAPI: true,
      apiRateLimit: 500,
      canAccessMobileApp: true,
      canAccessReports: true,
      canAccessDashboards: true,
      canBulkUpdate: false,
      canBulkDelete: false,
      canMassEmail: false,
      canBypassValidation: false,
      canRunApex: false,
    },
    isActive: true,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    createdBy: "SYSTEM",
    createdByName: "System",
    lastModifiedAt: new Date().toISOString(),
    lastModifiedBy: "SYSTEM",
    lastModifiedByName: "System",
  },
];

export function getAllProfiles(): ProfileResponse[] {
  return PREDEFINED_PROFILES;
}

export function getActiveProfiles(): ProfileResponse[] {
  return PREDEFINED_PROFILES.filter((profile) => profile.isActive && !profile.isDeleted);
}

export function getProfileById(id: string): ProfileResponse | undefined {
  return PREDEFINED_PROFILES.find((profile) => profile.id === id || profile.profileId === id);
}

export function getProfileByName(name: string): ProfileResponse | undefined {
  return PREDEFINED_PROFILES.find((profile) => profile.profileName.toLowerCase() === name.toLowerCase());
}

export function searchProfiles(query: string): ProfileResponse[] {
  const lowerQuery = query.toLowerCase();
  return PREDEFINED_PROFILES.filter(
    (profile) =>
      profile.profileName.toLowerCase().includes(lowerQuery) ||
      (profile.description && profile.description.toLowerCase().includes(lowerQuery))
  );
}
