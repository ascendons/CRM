"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCachedPermissions } from "@/hooks/usePermissions";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string; // Format: "OBJECT:ACTION" (e.g., "USER:CREATE")
  requiredPermissions?: string[]; // Multiple permissions (all required)
  requireAll?: boolean; // If true, all permissions required; if false, any one is enough
  fallbackUrl?: string; // Redirect URL if permission denied (default: /unauthorized)
}

/**
 * Component that wraps content requiring specific permissions.
 * Redirects to /unauthorized if user lacks required permissions.
 *
 * Usage:
 * <ProtectedRoute requiredPermission="USER:CREATE">
 *   <CreateUserButton />
 * </ProtectedRoute>
 *
 * <ProtectedRoute requiredPermissions={["USER:READ", "USER:EDIT"]} requireAll={false}>
 *   <UserManagement />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  requiredPermission,
  requiredPermissions,
  requireAll = true,
  fallbackUrl = "/unauthorized",
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Build list of permissions to check
  const permsToCheck = requiredPermissions || (requiredPermission ? [requiredPermission] : []);
  const { permissions, loading } = useCachedPermissions(permsToCheck);

  useEffect(() => {
    if (loading) return;

    // No permissions required - allow access
    if (permsToCheck.length === 0) {
      setIsAuthorized(true);
      return;
    }

    // Check permissions
    const hasAccess = requireAll
      ? permsToCheck.every((perm) => permissions[perm] === true)
      : permsToCheck.some((perm) => permissions[perm] === true);

    setIsAuthorized(hasAccess);

    // Redirect if unauthorized
    if (!hasAccess) {
      router.push(fallbackUrl);
    }
  }, [loading, permissions, permsToCheck, requireAll, fallbackUrl, router]);

  // Show loading state
  if (loading || isAuthorized === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show content if authorized
  if (isAuthorized) {
    return <>{children}</>;
  }

  // Don't render anything while redirecting
  return null;
}

/**
 * Higher-order component version for wrapping entire pages.
 *
 * Usage:
 * export default withPermission(UserManagementPage, "USER:READ");
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission: string,
  fallbackUrl = "/unauthorized"
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute requiredPermission={requiredPermission} fallbackUrl={fallbackUrl}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
