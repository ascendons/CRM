"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { meService, type CurrentUser, UserRole } from "@/lib/me";
import { authService } from "@/lib/auth";

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Component that protects admin routes.
 * Redirects non-admin users to unauthorized page.
 *
 * Usage:
 * <AdminRoute>
 *   <AdminPageContent />
 * </AdminRoute>
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    // Check if user is authenticated first
    if (!authService.isAuthenticated()) {
      setIsAuthorized(false);
      router.push("/login");
      return;
    }

    try {
      const user = await meService.getCurrentUser();
      setCurrentUser(user);

      // Check if user is admin using unified UserRole enum
      const isAdmin = user.userRole === UserRole.ADMIN;

      setIsAuthorized(isAdmin);

      if (!isAdmin) {
        // Redirect to unauthorized page
        router.push("/unauthorized");
      }
    } catch (error) {
      console.error("Failed to verify admin access:", error);
      setIsAuthorized(false);
      // Token might be invalid
      authService.logout();
      router.push("/login");
    }
  };

  // Show loading state
  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
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
