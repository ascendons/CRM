"use client";

import { useEffect, useState } from "react";
import { authService } from "@/lib/auth";
import { User } from "@/types/auth";

interface PermissionGuardProps {
    children: React.ReactNode;
    allowedRoles: string[]; // "ADMIN" | "MANAGER" | "SALES_REP" | "USER"
    fallback?: React.ReactNode;
}

export function PermissionGuard({
    children,
    allowedRoles,
    fallback = null,
}: PermissionGuardProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get user from auth service (it reads from localStorage synchronously mostly, but good to wrap)
        const currentUser = authService.getUser();
        setUser(currentUser);
        setLoading(false);
    }, []);

    if (loading) {
        return null; // or a spinner if this wraps a large section, but for buttons null is better
    }

    if (!user) {
        return <>{fallback}</>;
    }

    if (allowedRoles.includes(user.role)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
}
