import { useEffect, useState } from "react";
import { authService } from "@/lib/auth";
import { User } from "@/types/auth";
import { usePermissions } from "@/hooks/usePermissions";

interface PermissionGuardProps {
    children: React.ReactNode;
    allowedRoles?: string[]; // "ADMIN" | "MANAGER" | "SALES_REP" | "USER"
    fallback?: React.ReactNode;
}

export function PermissionGuard({
    children,
    allowedRoles,
    resource,
    action,
    fallback = null,
}: PermissionGuardProps & { resource?: string; action?: string }) {
    const [user, setUser] = useState<User | null>(null);
    const { hasPermission, loading: permissionsLoading } = usePermissions();
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAccess = async () => {
            const currentUser = authService.getUser();

            // Avoid setting state if user hasn't changed to prevent infinite loops
            // assuming user id is unique and sufficient for equality check
            setUser((prev) => {
                if (prev?.userId === currentUser?.userId && prev?.role === currentUser?.role) {
                    return prev;
                }
                return currentUser;
            });

            if (!currentUser) {
                setLoading(false);
                return;
            }

            if (resource && action) {
                const permitted = await hasPermission(resource, action);
                setHasAccess(permitted);
            } else if (allowedRoles && allowedRoles.length > 0) {
                setHasAccess(allowedRoles.includes(currentUser.role));
            } else {
                // No constraints provided, allow access
                setHasAccess(true);
            }
            setLoading(false);
        };

        checkAccess();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resource, action, JSON.stringify(allowedRoles), hasPermission]);

    if (loading || permissionsLoading) {
        return null;
    }

    if (!user) {
        return <>{fallback}</>;
    }

    if (hasAccess) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
}
