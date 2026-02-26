"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { UserMenu } from "@/components/UserMenu";
import { meService, type CurrentUser } from "@/lib/me";
import { authService } from "@/lib/auth";
import { usePermissionContext } from "@/providers/PermissionProvider";
import { useOrganization } from "@/providers/OrganizationProvider";
import ChatPanel from "./ChatPanel";
import NotificationPanel from "./NotificationPanel";
import { useWebSocket } from "@/providers/WebSocketProvider";

export default function Navigation() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get permission checks from context (LEAN RBAC)
  const { canAccessModule, canAccessPath, loading: permissionsLoading } = usePermissionContext();

  // Get organization context
  const { organization } = useOrganization();

  // Get WebSocket context
  const { unreadNotificationCount, unreadMessageCount, clearUnreadMessages } = useWebSocket();

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
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-10">
        <div className="flex items-center gap-4 lg:gap-8">
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
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4 lg:gap-8">
        <button
          type="button"
          className="lg:hidden -ml-2 p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
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
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Chat Button */}
        <button
          onClick={() => {
            setIsChatOpen(true);
            clearUnreadMessages();
          }}
          className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg relative transition-colors"
        >
          <span className="material-symbols-outlined">chat</span>
          {unreadMessageCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full border-2 border-white transform translate-x-1/4 -translate-y-1/4 min-w-[18px] min-h-[18px]">
              {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
            </span>
          )}
        </button>

        {/* Notifications Button */}
        <button
          onClick={() => setIsNotificationsOpen(true)}
          className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg relative transition-colors"
        >
          <span className="material-symbols-outlined">notifications</span>
          {unreadNotificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
          )}
        </button>

        <div className="h-8 w-px bg-slate-200 mx-2"></div>
        <UserMenu />
      </div>

      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <NotificationPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />

      {/* Mobile menu */}
      <Transition.Root show={isMobileMenuOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setIsMobileMenuOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                  <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-slate-100">
                    <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
                      {organization?.settings?.logoUrl ? (
                        <div className="size-8 rounded-lg flex items-center justify-center overflow-hidden border border-slate-100">
                          <img
                            src={organization.settings.logoUrl}
                            alt={organization.organizationName}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
                          <span className="material-symbols-outlined text-sm">rocket_launch</span>
                        </div>
                      )}
                      <div>
                        <h1 className="text-base font-bold leading-none tracking-tight text-slate-900">
                          {organization?.displayName || organization?.organizationName || "Ascendons CRM"}
                        </h1>
                      </div>
                    </Link>
                    <button
                      type="button"
                      className="p-2 -mr-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  <nav className="flex flex-1 flex-col gap-1 px-4 py-6">
                    <MobileNavLink href="/dashboard" label="Dashboard" isActive={isActive("/dashboard")} onClick={() => setIsMobileMenuOpen(false)} />
                    {canAccessModule("ANALYTICS") && <MobileNavLink href="/analytics" label="Analytics" isActive={isActive("/analytics")} onClick={() => setIsMobileMenuOpen(false)} />}
                    {canAccessModule("CRM") && <MobileNavLink href="/leads" label="Leads" isActive={isActive("/leads")} onClick={() => setIsMobileMenuOpen(false)} />}
                    {canAccessModule("CRM") && <MobileNavLink href="/opportunities" label="Deals" isActive={isActive("/opportunities")} onClick={() => setIsMobileMenuOpen(false)} />}
                    {canAccessModule("CRM") && <MobileNavLink href="/contacts" label="Contacts" isActive={isActive("/contacts")} onClick={() => setIsMobileMenuOpen(false)} />}
                    {canAccessModule("CRM") && <MobileNavLink href="/accounts" label="Accounts" isActive={isActive("/accounts")} onClick={() => setIsMobileMenuOpen(false)} />}
                    {canAccessModule("PRODUCTS") && <MobileNavLink href="/proposals" label="Proposals" isActive={isActive("/proposals")} onClick={() => setIsMobileMenuOpen(false)} />}
                    <MobileNavLink href="/activities" label="Activities" isActive={isActive("/activities")} onClick={() => setIsMobileMenuOpen(false)} />
                    {canAccessModule("ADMINISTRATION") && <MobileNavLink href="/catalog" label="Catalog" isActive={isActive("/catalog")} onClick={() => setIsMobileMenuOpen(false)} />}
                    {canAccessModule("ADMINISTRATION") && <MobileNavLink href="/admin" label="Admin" isActive={isActive("/admin")} onClick={() => setIsMobileMenuOpen(false)} />}
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </header >
  );
}

function MobileNavLink({ href, label, isActive, onClick }: { href: string, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${isActive
          ? "bg-primary/10 text-primary"
          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
        }`}
    >
      {label}
    </Link>
  );
}
