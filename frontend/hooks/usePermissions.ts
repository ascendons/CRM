import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";

interface PermissionCache {
  [key: string]: boolean;
}

/**
 * Hook for checking user permissions in the UI.
 * Caches results to avoid redundant API calls.
 *
 * Usage:
 * const { hasPermission, loading } = usePermissions();
 *
 * if (hasPermission('USER', 'CREATE')) {
 *   // Show create button
 * }
 */
export function usePermissions() {
  const [permissionCache, setPermissionCache] = useState<PermissionCache>({});
  const [loading, setLoading] = useState(false);

  /**
   * Check if current user has permission on an object.
   * Results are cached in memory.
   *
   * @param objectName - Object name (USER, LEAD, ACCOUNT, ROLE, PROFILE, etc.)
   * @param action - Action (CREATE, READ, EDIT, DELETE, VIEWALL, MODIFYALL)
   * @returns true if user has permission
   */
  const hasPermission = async (objectName: string, action: string): Promise<boolean> => {
    const cacheKey = `${objectName}:${action}`;

    // Return cached result if available
    if (permissionCache[cacheKey] !== undefined) {
      return permissionCache[cacheKey];
    }

    setLoading(true);
    try {
      // Call backend permission check endpoint
      const result = await api.get<boolean>(
        `/permissions/check?object=${objectName}&action=${action}`
      );

      // Cache the result
      setPermissionCache((prev) => ({
        ...prev,
        [cacheKey]: result,
      }));

      return result;
    } catch (error) {
      console.error("Permission check failed:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if current user has a system permission.
   *
   * @param permission - Permission name (canManageUsers, canManageRoles, etc.)
   * @returns true if user has permission
   */
  const hasSystemPermission = async (permission: string): Promise<boolean> => {
    const cacheKey = `SYSTEM:${permission}`;

    if (permissionCache[cacheKey] !== undefined) {
      return permissionCache[cacheKey];
    }

    setLoading(true);
    try {
      const result = await api.get<boolean>(
        `/permissions/system?permission=${permission}`
      );

      setPermissionCache((prev) => ({
        ...prev,
        [cacheKey]: result,
      }));

      return result;
    } catch (error) {
      console.error("System permission check failed:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear permission cache (call on logout or role change).
   */
  const clearCache = () => {
    setPermissionCache({});
  };

  return {
    hasPermission,
    hasSystemPermission,
    loading,
    clearCache,
  };
}

/**
 * Synchronous permission check hook using cached data.
 * Loads permissions on mount, returns synchronous checks.
 *
 * Usage:
 * const permissions = useCachedPermissions(['USER:CREATE', 'LEAD:READ']);
 *
 * if (permissions['USER:CREATE']) {
 *   // Show create button
 * }
 */
export function useCachedPermissions(requiredPermissions: string[]) {
  const [permissions, setPermissions] = useState<PermissionCache>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      setLoading(true);
      try {
        // Parse required permissions (format: "OBJECT:ACTION")
        const checks = requiredPermissions.map((perm) => {
          const [object, action] = perm.split(":");
          return { object, action, key: perm };
        });

        // Batch load all permissions
        const results = await Promise.all(
          checks.map(async ({ object, action, key }) => {
            try {
              const result = await api.get<boolean>(
                `/permissions/check?object=${object}&action=${action}`
              );
              return { key, result };
            } catch {
              return { key, result: false };
            }
          })
        );

        // Build permission map
        const permMap: PermissionCache = {};
        results.forEach(({ key, result }) => {
          permMap[key] = result;
        });

        setPermissions(permMap);
      } catch (error) {
        console.error("Failed to load permissions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (requiredPermissions.length > 0) {
      loadPermissions();
    } else {
      setLoading(false);
    }
  }, [requiredPermissions.join(",")]);

  return { permissions, loading };
}
