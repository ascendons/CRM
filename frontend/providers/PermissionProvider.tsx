"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";

// ===== TYPE DEFINITIONS =====

interface ModulePermission {
  moduleName: string;
  displayName: string;
  canAccess: boolean;
  includedPaths: string[];
  description?: string;
}

interface ObjectPermission {
  objectName: string;
  canCreate: boolean;
  canRead: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  canModifyAll: boolean;
}

interface SystemPermissions {
  dataVisibility: string;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canManageProfiles: boolean;
  canViewSetup: boolean;
  canManageSharing: boolean;
  canViewAllData: boolean;
  canModifyAllData: boolean;
  canViewAuditLog: boolean;
  canExportData: boolean;
  canImportData: boolean;
}

interface UserPermissionsManifest {
  modules: ModulePermission[];
  objectPermissions: ObjectPermission[];
  systemPermissions: SystemPermissions;
  fieldPermissions?: any[];
}

interface PermissionContextType {
  // Module-based permissions (LEAN RBAC)
  canAccessModule: (moduleName: string) => boolean;
  canAccessPath: (path: string) => boolean;

  // Object-level permissions
  hasPermission: (objectName: string, action: string) => boolean;

  // System-level permissions
  hasSystemPermission: (permission: string) => boolean;
  getDataVisibility: () => string;

  // Permission manifest
  permissions: UserPermissionsManifest | null;

  // State
  loading: boolean;
  error: string | null;

  // Actions
  clearCache: () => void;
  reload: () => void;
}

// ===== CONTEXT =====

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

// ===== PROVIDER =====

interface PermissionProviderProps {
  children: ReactNode;
}

/**
 * Permission Provider (LEAN RBAC VERSION)
 *
 * Loads user permissions once on mount and provides them via context.
 * All components can access permissions without making API calls.
 *
 * Wrap your app with this provider in layout.tsx:
 * <PermissionProvider>
 *   <YourApp />
 * </PermissionProvider>
 */
export function PermissionProvider({ children }: PermissionProviderProps) {
  const permissionHook = usePermissions();

  return (
    <PermissionContext.Provider value={permissionHook}>
      {children}
    </PermissionContext.Provider>
  );
}

// ===== HOOK =====

/**
 * Hook to access permission context
 *
 * Usage:
 * const { canAccessModule, hasPermission, loading } = usePermissionContext();
 *
 * if (canAccessModule('CRM')) {
 *   // Show CRM module
 * }
 */
export function usePermissionContext() {
  const context = useContext(PermissionContext);

  if (context === undefined) {
    throw new Error(
      "usePermissionContext must be used within a PermissionProvider. " +
      "Wrap your app with <PermissionProvider> in layout.tsx"
    );
  }

  return context;
}
