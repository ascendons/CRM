import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";

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
  fieldPermissions?: any[]; // Optional, not used in lean RBAC
}

// ===== HOOK =====

/**
 * Hook for checking user permissions in the UI (LEAN RBAC VERSION)
 *
 * Loads full permission manifest once on mount, provides instant permission checks.
 * No API calls on every check - all permissions cached in memory.
 *
 * Usage:
 * const { canAccessModule, canAccessPath, hasPermission, loading } = usePermissions();
 *
 * if (canAccessModule('CRM')) {
 *   // Show CRM module
 * }
 *
 * if (hasPermission('LEAD', 'CREATE')) {
 *   // Show create lead button
 * }
 */
export function usePermissions() {
  const [permissions, setPermissions] = useState<UserPermissionsManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load full permission manifest from backend (called once on mount)
   */
  const loadPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const manifest = await api.get<UserPermissionsManifest>("/users/me/permissions");
      setPermissions(manifest);
      console.log("[usePermissions] Permission manifest loaded successfully", manifest);
    } catch (err: any) {
      console.error("[usePermissions] Failed to load permission manifest:", err);
      setError(err.message || "Failed to load permissions");
      setPermissions(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load permissions on mount
   */
  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  /**
   * Check if user can access a module (instant, no API call)
   *
   * @param moduleName - Module name (CRM, ADMINISTRATION, ANALYTICS, PRODUCTS, ACTIVITIES)
   * @returns true if user can access the module
   */
  const canAccessModule = useCallback((moduleName: string): boolean => {
    if (!permissions || !permissions.modules) {
      console.log(`[canAccessModule] No permissions loaded yet for module: ${moduleName}`);
      return false;
    }

    const module = permissions.modules.find(
      (m) => m.moduleName.toUpperCase() === moduleName.toUpperCase()
    );

    const hasAccess = module?.canAccess ?? false;
    console.log(`[canAccessModule] Module: ${moduleName}, Found: ${!!module}, canAccess: ${hasAccess}`);
    return hasAccess;
  }, [permissions]);

  /**
   * Check if user can access a specific path (instant, no API call)
   * Path is matched against module's includedPaths list
   *
   * @param path - Path to check (e.g., /leads, /admin/users)
   * @returns true if user can access the path
   */
  const canAccessPath = useCallback((path: string): boolean => {
    if (!permissions || !permissions.modules) {
      return false;
    }

    // Check if path belongs to any accessible module
    return permissions.modules.some((module) => {
      if (!module.canAccess) return false;
      if (!module.includedPaths) return false;

      return module.includedPaths.some((includedPath) => {
        // Support wildcard matching: "/admin/*" matches "/admin/users"
        if (includedPath.endsWith("/*")) {
          const prefix = includedPath.substring(0, includedPath.length - 2);
          return path.startsWith(prefix);
        }
        return path === includedPath || path.startsWith(includedPath + "/");
      });
    });
  }, [permissions]);

  /**
   * Check if user has permission on an object (instant, no API call)
   *
   * @param objectName - Object name (USER, LEAD, ACCOUNT, etc.)
   * @param action - Action (CREATE, READ, EDIT, DELETE, VIEWALL, MODIFYALL)
   * @returns true if user has permission
   */
  const hasPermission = useCallback((objectName: string, action: string): boolean => {
    if (!permissions || !permissions.objectPermissions) {
      return false;
    }

    const objectPerm = permissions.objectPermissions.find(
      (op) => op.objectName.toUpperCase() === objectName.toUpperCase()
    );

    if (!objectPerm) {
      return false;
    }

    switch (action.toUpperCase()) {
      case "CREATE":
        return objectPerm.canCreate;
      case "READ":
        return objectPerm.canRead;
      case "EDIT":
      case "UPDATE":
        return objectPerm.canEdit;
      case "DELETE":
        return objectPerm.canDelete;
      case "VIEWALL":
        return objectPerm.canViewAll;
      case "MODIFYALL":
        return objectPerm.canModifyAll;
      default:
        return false;
    }
  }, [permissions]);

  /**
   * Check if user has a system permission (instant, no API call)
   *
   * @param permission - Permission name (canManageUsers, canManageRoles, etc.)
   * @returns true if user has permission
   */
  const hasSystemPermission = useCallback((permission: string): boolean => {
    if (!permissions || !permissions.systemPermissions) {
      return false;
    }

    const systemPerms = permissions.systemPermissions;

    switch (permission.toLowerCase()) {
      case "canmanageusers":
        return systemPerms.canManageUsers;
      case "canmanageroles":
        return systemPerms.canManageRoles;
      case "canmanageprofiles":
        return systemPerms.canManageProfiles;
      case "canviewsetup":
        return systemPerms.canViewSetup;
      case "canmanagesharing":
        return systemPerms.canManageSharing;
      case "canviewalldata":
        return systemPerms.canViewAllData;
      case "canmodifyalldata":
        return systemPerms.canModifyAllData;
      case "canviewauditlog":
        return systemPerms.canViewAuditLog;
      case "canexportdata":
        return systemPerms.canExportData;
      case "canimportdata":
        return systemPerms.canImportData;
      default:
        return false;
    }
  }, [permissions]);

  /**
   * Get data visibility level for current user
   * @returns OWN | SUBORDINATES | ALL_USERS | ALL
   */
  const getDataVisibility = useCallback((): string => {
    return permissions?.systemPermissions?.dataVisibility || "OWN";
  }, [permissions]);

  /**
   * Clear permission cache (call on logout or role change)
   */
  const clearCache = useCallback(() => {
    setPermissions(null);
  }, []);

  /**
   * Reload permissions from backend
   */
  const reload = useCallback(() => {
    loadPermissions();
  }, [loadPermissions]);

  return {
    // Module-based permissions (LEAN RBAC)
    canAccessModule,
    canAccessPath,

    // Object-level permissions
    hasPermission,

    // System-level permissions
    hasSystemPermission,
    getDataVisibility,

    // Permission manifest
    permissions,

    // State
    loading,
    error,

    // Actions
    clearCache,
    reload,
  };
}

/**
 * Synchronous permission check hook using pre-loaded data.
 * Useful for components that need to check multiple permissions at once.
 *
 * @deprecated Use usePermissions() instead - it provides instant checks after initial load
 */
export function useCachedPermissions(requiredPermissions: string[]) {
  console.warn(
    "[useCachedPermissions] DEPRECATED: Use usePermissions() instead. " +
    "The new hook loads all permissions once and provides instant checks."
  );

  const { hasPermission, loading } = usePermissions();
  const [permissions, setPermissions] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const checkPermissions = async () => {
      const permMap: { [key: string]: boolean } = {};

      for (const perm of requiredPermissions) {
        const [object, action] = perm.split(":");
        if (object && action) {
          permMap[perm] = hasPermission(object, action);
        }
      }

      setPermissions(permMap);
    };

    if (!loading) {
      checkPermissions();
    }
  }, [requiredPermissions.join(","), loading, hasPermission]);

  return { permissions, loading };
}
