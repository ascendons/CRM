"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserMenu } from "@/components/UserMenu";
import { meService, type CurrentUser } from "@/lib/me";
import { authService } from "@/lib/auth";
import { usePermissionContext } from "@/providers/PermissionProvider";
import { useOrganization } from "@/providers/OrganizationProvider";

export default function Navigation() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Get permission checks from context (LEAN RBAC)
  const { canAccessModule, canAccessPath, loading: permissionsLoading } = usePermissionContext();

  // Get organization context
  const { organization } = useOrganization();

  // Hide navigation on login and register pages
  const hideNavigation = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    if (!hideNavigation && authService.isAuthenticated()) {
      loadCurrentUser();
    } else {
      setLoading(false);
    }
  }, [hideNavigation]);

  const loadCurrentUser = async () => {
    try {
      const user = await meService.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error("Failed to load current user:", error);
      // If /me fails, token might be invalid - logout
      authService.logout();
    } finally {
      setLoading(false);
    }
  };

  if (hideNavigation) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(path);
  };

  // Don't render navigation until permissions are loaded
  if (permissionsLoading) {
    return (
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 lg:px-8 sticky top-0 z-10">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white overflow-hidden">
              <span className="material-symbols-outlined">rocket_launch</span>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none tracking-tight text-slate-900">
                Ascendons CRM
              </h1>
            </div>
          </Link>
          <div className="h-8 w-px bg-slate-200 mx-2"></div>
          <nav className="hidden lg:flex items-center gap-6">
            <span className="text-sm text-slate-400">Loading...</span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <UserMenu />
        </div>
      </header>
    );
  }

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 lg:px-8 sticky top-0 z-10">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="flex items-center gap-3">
          {organization?.settings?.logoUrl ? (
            <div className="size-10 rounded-lg flex items-center justify-center overflow-hidden border border-slate-100">
              <img
                src={organization.settings.logoUrl}
                alt={organization.organizationName}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined">rocket_launch</span>
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold leading-none tracking-tight text-slate-900">
              {organization?.displayName || organization?.organizationName || "Ascendons CRM"}
            </h1>
            <p className="text-xs text-slate-700 font-medium">Enterprise Edition</p>
          </div>
        </Link>
        <div className="h-8 w-px bg-slate-200 mx-2"></div>
        <nav className="hidden lg:flex items-center gap-6">
          {/* Dashboard - always visible */}
          <Link
            href="/dashboard"
            className={`text-sm font-medium transition-colors ${isActive("/dashboard")
              ? "text-primary border-b-2 border-primary pb-1 font-semibold"
              : "text-slate-700 hover:text-primary"
              }`}
          >
            Dashboard
          </Link>

          {/* Analytics - Module: ANALYTICS */}
          {canAccessModule("ANALYTICS") && (
            <Link
              href="/analytics"
              className={`text-sm font-medium transition-colors ${isActive("/analytics")
                ? "text-primary border-b-2 border-primary pb-1 font-semibold"
                : "text-slate-700 hover:text-primary"
                }`}
            >
              Analytics
            </Link>
          )}

          {/* Leads - Module: CRM */}
          {canAccessModule("CRM") && (
            <Link
              href="/leads"
              className={`text-sm font-medium transition-colors ${isActive("/leads")
                ? "text-primary border-b-2 border-primary pb-1 font-semibold"
                : "text-slate-700 hover:text-primary"
                }`}
            >
              Leads
            </Link>
          )}

          {/* Opportunities/Deals - Module: CRM */}
          {canAccessModule("CRM") && (
            <Link
              href="/opportunities"
              className={`text-sm font-medium transition-colors ${isActive("/opportunities")
                ? "text-primary border-b-2 border-primary pb-1 font-semibold"
                : "text-slate-700 hover:text-primary"
                }`}
            >
              Deals
            </Link>
          )}

          {/* Contacts - Module: CRM */}
          {canAccessModule("CRM") && (
            <Link
              href="/contacts"
              className={`text-sm font-medium transition-colors ${isActive("/contacts")
                ? "text-primary border-b-2 border-primary pb-1 font-semibold"
                : "text-slate-700 hover:text-primary"
                }`}
            >
              Contacts
            </Link>
          )}

          {/* Accounts - Module: CRM */}
          {canAccessModule("CRM") && (
            <Link
              href="/accounts"
              className={`text-sm font-medium transition-colors ${isActive("/accounts")
                ? "text-primary border-b-2 border-primary pb-1 font-semibold"
                : "text-slate-700 hover:text-primary"
                }`}
            >
              Accounts
            </Link>
          )}

          {/* Proposals - Module: PRODUCTS */}
          {canAccessModule("PRODUCTS") && (
            <Link
              href="/proposals"
              className={`text-sm font-medium transition-colors ${isActive("/proposals")
                ? "text-primary border-b-2 border-primary pb-1 font-semibold"
                : "text-slate-700 hover:text-primary"
                }`}
            >
              Proposals
            </Link>
          )}

          {/* Activities - Always visible if authenticated */}
          <Link
            href="/activities"
            className={`text-sm font-medium transition-colors ${isActive("/activities")
              ? "text-primary border-b-2 border-primary pb-1 font-semibold"
              : "text-slate-700 hover:text-primary"
              }`}
          >
            Activities
          </Link>

          {/* Catalog - Admin Only */}
          {canAccessModule("ADMINISTRATION") && (
            <Link
              href="/catalog"
              className={`text-sm font-medium transition-colors ${isActive("/catalog")
                ? "text-primary border-b-2 border-primary pb-1 font-semibold"
                : "text-slate-700 hover:text-primary"
                }`}
            >
              Catalog
            </Link>
          )}

          {/* Admin - Module: ADMINISTRATION */}
          {canAccessModule("ADMINISTRATION") && (
            <Link
              href="/admin"
              className={`text-sm font-medium transition-colors ${isActive("/admin")
                ? "text-primary border-b-2 border-primary pb-1 font-semibold"
                : "text-slate-700 hover:text-primary"
                }`}
            >
              Admin
            </Link>
          )}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg relative transition-colors">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
        </button>

        <div className="h-8 w-px bg-slate-200 mx-2"></div>
        <UserMenu />
      </div>
    </header >
  );
}
