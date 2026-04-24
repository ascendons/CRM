"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, Fragment, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { usePermissionContext } from "@/providers/PermissionProvider";
import { useOrganization } from "@/providers/OrganizationProvider";

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
  module?: string;
  alwaysVisible?: boolean;
  badge?: number | string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function Sidebar({
  isMobileOpen,
  onMobileClose,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { canAccessModule } = usePermissionContext();
  const { organization } = useOrganization();
  const [user, setUser] = useState<{ name: string; initials: string } | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  // Auto-expand section based on current path
  useEffect(() => {
    if (pathname) {
      const allSections = navSections;
      const activeSection = allSections.find((section) =>
        section.items.some((item) => pathname.startsWith(item.href))
      );

      if (activeSection && activeSection.title && !expandedSections.includes(activeSection.title)) {
        setExpandedSections([...expandedSections, activeSection.title]);
      }
    }
  }, [pathname, expandedSections]);

  // Toggle section expansion
  const toggleSection = (sectionTitle: string) => {
    if (expandedSections.includes(sectionTitle)) {
      setExpandedSections(expandedSections.filter((s) => s !== sectionTitle));
    } else {
      setExpandedSections([...expandedSections, sectionTitle]); // Allow multiple sections open
    }
  };

  // Load user info from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        try {
          const parts = token.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
            const email = payload.sub || payload.email || "";
            const name = payload.name || email.split("@")[0] || "User";
            const initials = name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            setUser({ name, initials });
          }
        } catch (e) {
          console.error("Failed to parse token:", e);
        }
      }
    }
  }, []);

  const isActive = (path: string) => {
    // Special case: base routes that have sub-routes should only match exactly
    // This prevents /inventory from being active when on /inventory/stock
    if (path === "/inventory" || path === "/admin") {
      return pathname === path;
    }

    // Exact match
    if (pathname === path) {
      return true;
    }

    // Check if pathname starts with path + slash (sub-route)
    // This allows /inventory/stock to be active when on /inventory/stock/edit/123
    return pathname.startsWith(path + "/");
  };

  // Navigation structure
  const navSections: NavSection[] = [
    {
      title: "",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: "dashboard", alwaysVisible: true },
        { href: "/analytics", label: "Analytics", icon: "analytics", module: "ANALYTICS" },
      ],
    },
    {
      title: "CRM",
      items: [
        { href: "/leads", label: "Leads", icon: "person_search", module: "CRM" },
        { href: "/opportunities", label: "Deals", icon: "monetization_on", module: "CRM" },
        { href: "/contacts", label: "Contacts", icon: "contacts", module: "CRM" },
        { href: "/accounts", label: "Accounts", icon: "business", module: "CRM" },
      ],
    },
    {
      title: "Sales",
      items: [
        { href: "/proposals", label: "Proposals", icon: "description", module: "PRODUCTS" },
        { href: "/catalog", label: "Catalog", icon: "inventory_2", module: "ADMINISTRATION" },
        { href: "/activities", label: "Activities", icon: "event_note", alwaysVisible: true },
        { href: "/calendar", label: "Calendar", icon: "calendar_month", alwaysVisible: true },
      ],
    },
    {
      title: "Inventory",
      items: [
        { href: "/inventory", label: "Overview", icon: "dashboard", module: "ADMINISTRATION" },
        {
          href: "/inventory/stock",
          label: "Stock Management",
          icon: "inventory",
          module: "ADMINISTRATION",
        },
        {
          href: "/inventory/warehouses",
          label: "Warehouses",
          icon: "store",
          module: "ADMINISTRATION",
        },
        {
          href: "/inventory/purchase-orders",
          label: "Purchase Orders",
          icon: "shopping_cart",
          module: "ADMINISTRATION",
        },
        {
          href: "/inventory/reports",
          label: "Reports & Analytics",
          icon: "analytics",
          module: "ADMINISTRATION",
        },
      ],
    },
    {
      title: "HR Management",
      items: [
        { href: "/attendance", label: "Attendance", icon: "schedule", alwaysVisible: true },
        { href: "/leaves", label: "Leaves", icon: "beach_access", alwaysVisible: true },
        {
          href: "/admin/attendance/shifts",
          label: "Shift Management",
          icon: "work_history",
          module: "ADMINISTRATION",
        },
      ],
    },
    {
      title: "Field Service",
      items: [
        { href: "/assets", label: "Asset Registry", icon: "inventory", module: "FIELD_SERVICE" },
        { href: "/contracts", label: "Contracts", icon: "history_edu", module: "FIELD_SERVICE" },
        {
          href: "/service-requests",
          label: "Service Requests",
          icon: "support_agent",
          module: "FIELD_SERVICE",
        },
        {
          href: "/work-orders",
          label: "Work Orders",
          icon: "engineering",
          module: "FIELD_SERVICE",
        },
        { href: "/dispatch", label: "Dispatch Board", icon: "route", module: "FIELD_SERVICE" },
        { href: "/dispatch/map", label: "Field Map", icon: "location_on", module: "FIELD_SERVICE" },
        {
          href: "/skill-matrix",
          label: "Skill Matrix",
          icon: "psychology",
          module: "FIELD_SERVICE",
        },
        {
          href: "/parts-requests",
          label: "Parts Requests",
          icon: "category",
          module: "FIELD_SERVICE",
        },
      ],
    },
    {
      title: "Procurement",
      items: [
        { href: "/vendors", label: "Vendors", icon: "store", module: "PROCUREMENT" },
        { href: "/procurement/rfq", label: "RFQ", icon: "request_quote", module: "PROCUREMENT" },
        { href: "/procurement/grn", label: "GRN", icon: "receipt_long", module: "PROCUREMENT" },
        {
          href: "/procurement/rate-contracts",
          label: "Rate Contracts",
          icon: "handshake",
          module: "PROCUREMENT",
        },
        {
          href: "/procurement/purchase-orders",
          label: "PO Approval",
          icon: "approval",
          module: "PROCUREMENT",
        },
      ],
    },
    {
      title: "Projects Hub",
      items: [
        { href: "/projects", label: "Projects", icon: "folder", module: "PROJECTS" },
        { href: "/timesheets", label: "Timesheets", icon: "timer", module: "PROJECTS" },
        { href: "/projects/workload", label: "Workload", icon: "people", module: "PROJECTS" },
      ],
    },
    {
      title: "Knowledge Base",
      items: [
        {
          href: "/knowledge-base",
          label: "Knowledge Base",
          icon: "menu_book",
          module: "KNOWLEDGE_BASE",
        },
      ],
    },
    {
      title: "Marketing",
      items: [
        { href: "/marketing/forms", label: "Web Forms", icon: "dynamic_form", module: "WEB_FORMS" },
        {
          href: "/marketing/landing-pages",
          label: "Landing Pages",
          icon: "web",
          module: "WEB_FORMS",
        },
      ],
    },
    {
      title: "Channel Partners",
      items: [
        { href: "/dealers", label: "Dealers", icon: "storefront", module: "DEALER_MANAGEMENT" },
      ],
    },
    {
      title: "Administration",
      items: [
        { href: "/admin/engineers", label: "Engineers", icon: "badge", module: "ADMINISTRATION" },
        {
          href: "/admin",
          label: "Admin Panel",
          icon: "admin_panel_settings",
          module: "ADMINISTRATION",
        },
        { href: "/admin/settings", label: "Settings", icon: "settings", module: "ADMINISTRATION" },
        {
          href: "/admin/settings/escalation",
          label: "Escalation Rules",
          icon: "warning",
          module: "ADMINISTRATION",
        },
      ],
    },
  ];

  // Filter items based on permissions
  const filterItems = (items: NavItem[]) => {
    return items.filter((item) => {
      if (item.alwaysVisible) return true;
      if (item.module) return canAccessModule(item.module);
      return true;
    });
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col bg-slate-900 text-white">
      {/* Logo Section */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-3"
          onClick={mobile ? onMobileClose : undefined}
        >
          {organization?.settings?.logoUrl ? (
            <div className="size-9 rounded-lg flex items-center justify-center overflow-hidden bg-white/10">
              <img
                src={organization.settings.logoUrl}
                alt={organization.organizationName}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="size-9 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">rocket_launch</span>
            </div>
          )}
          {(!isCollapsed || mobile) && (
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold leading-tight text-white truncate">
                {organization?.displayName || organization?.organizationName || "Ascendons CRM"}
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">Enterprise Edition</p>
            </div>
          )}
        </Link>
        {mobile && (
          <button
            onClick={onMobileClose}
            className="p-2 -mr-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
        {!mobile && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="material-symbols-outlined text-lg">
              {isCollapsed ? "chevron_right" : "chevron_left"}
            </span>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {navSections.map((section, sectionIndex) => {
          const visibleItems = filterItems(section.items);
          if (visibleItems.length === 0) return null;

          const isExpanded = expandedSections.includes(section.title);
          const hasActiveItem = section.items.some((item) => isActive(item.href));

          // For top-level items (no title), show them directly without collapsing
          if (!section.title) {
            return (
              <div key={sectionIndex} className="space-y-1">
                {visibleItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={mobile ? onMobileClose : undefined}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative
                        ${
                          active
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }
                        ${isCollapsed && !mobile ? "justify-center" : ""}
                      `}
                      title={isCollapsed && !mobile ? item.label : undefined}
                    >
                      <span
                        className={`material-symbols-outlined ${active ? "text-white" : "text-slate-400 group-hover:text-white"}`}
                      >
                        {item.icon}
                      </span>
                      {(!isCollapsed || mobile) && (
                        <>
                          <span className="text-sm font-medium flex-1">{item.label}</span>
                          {item.badge && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
                              {item.badge}
                            </span>
                          )}
                          {active && (
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          }

          // For sections with titles, make them collapsible
          return (
            <div key={sectionIndex}>
              {/* Section Header - Clickable to expand/collapse */}
              {(!isCollapsed || mobile) && (
                <button
                  onClick={() => toggleSection(section.title)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-lg
                    transition-all group
                    ${
                      hasActiveItem || isExpanded
                        ? "bg-slate-800/50 text-white"
                        : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-300"
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">
                      {isExpanded ? "folder_open" : "folder"}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      {section.title}
                    </span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-sm transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  >
                    chevron_right
                  </span>
                </button>
              )}

              {/* Section Divider (when sidebar collapsed) */}
              {section.title && isCollapsed && !mobile && (
                <div className="mx-2 my-2 border-t border-slate-800"></div>
              )}

              {/* Navigation Items - Show only when expanded or sidebar is collapsed */}
              {(isExpanded || (isCollapsed && !mobile)) && (
                <div className={`space-y-1 ${!isCollapsed || mobile ? "mt-1 ml-2" : ""}`}>
                  {visibleItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={mobile ? onMobileClose : undefined}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative
                          ${
                            active
                              ? "bg-primary text-white shadow-lg shadow-primary/20"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }
                          ${isCollapsed && !mobile ? "justify-center" : ""}
                        `}
                        title={isCollapsed && !mobile ? item.label : undefined}
                      >
                        <span
                          className={`material-symbols-outlined text-base ${active ? "text-white" : "text-slate-400 group-hover:text-white"}`}
                        >
                          {item.icon}
                        </span>
                        {(!isCollapsed || mobile) && (
                          <>
                            <span className="text-sm font-medium flex-1">{item.label}</span>
                            {item.badge && (
                              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
                                {item.badge}
                              </span>
                            )}
                            {active && (
                              <span className="material-symbols-outlined text-sm">
                                chevron_right
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer - User Profile & Collapse (Desktop) */}
      {!mobile && (
        <div className="border-t border-slate-800 p-3 space-y-2">
          {/* Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              text-slate-400 hover:bg-slate-800 hover:text-white transition-all
              ${isCollapsed ? "justify-center" : ""}
            `}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="material-symbols-outlined">
              {isCollapsed ? "keyboard_double_arrow_right" : "keyboard_double_arrow_left"}
            </span>
            {!isCollapsed && <span className="text-sm font-medium">Collapse</span>}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-slate-900
          transition-all duration-300 ease-in-out z-30
          ${isCollapsed ? "w-16" : "w-64"}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Slide-out) */}
      <Transition.Root show={isMobileOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onMobileClose}>
          {/* Backdrop */}
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

          {/* Sidebar Panel */}
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
              <Dialog.Panel className="relative flex w-full max-w-xs">
                <SidebarContent mobile />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}
