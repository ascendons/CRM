"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, Fragment } from "react";
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
  module?: string; // Permission module (e.g., "CRM", "ANALYTICS")
  alwaysVisible?: boolean; // Show without permission check
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function Sidebar({ isMobileOpen, onMobileClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { canAccessModule } = usePermissionContext();
  const { organization } = useOrganization();

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(path);
  };

  // Navigation structure with icons and grouping
  const navSections: NavSection[] = [
    {
      title: "", // No title for top-level items
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
        { href: "/accounts", label: "business", icon: "business", module: "CRM" },
      ],
    },
    {
      title: "Sales",
      items: [
        { href: "/proposals", label: "Proposals", icon: "description", module: "PRODUCTS" },
        { href: "/catalog", label: "Catalog", icon: "inventory_2", module: "ADMINISTRATION" },
        { href: "/activities", label: "Activities", icon: "event_note", alwaysVisible: true },
      ],
    },
    {
      title: "HR Management",
      items: [
        { href: "/attendance", label: "Attendance", icon: "schedule", alwaysVisible: true },
        { href: "/leaves", label: "Leaves", icon: "beach_access", alwaysVisible: true },
      ],
    },
    {
      title: "Administration",
      items: [
        { href: "/admin", label: "Admin Panel", icon: "settings", module: "ADMINISTRATION" },
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
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section, sectionIndex) => {
          const visibleItems = filterItems(section.items);
          if (visibleItems.length === 0) return null;

          return (
            <div key={sectionIndex}>
              {/* Section Title */}
              {section.title && (!isCollapsed || mobile) && (
                <div className="px-3 mb-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {section.title}
                  </h3>
                </div>
              )}

              {/* Section Divider (when collapsed) */}
              {section.title && isCollapsed && !mobile && (
                <div className="mx-2 mb-3 border-t border-slate-800"></div>
              )}

              {/* Navigation Items */}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={mobile ? onMobileClose : undefined}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group
                        ${active
                          ? "bg-primary text-white shadow-lg shadow-primary/20"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }
                        ${isCollapsed && !mobile ? "justify-center" : ""}
                      `}
                      title={isCollapsed && !mobile ? item.label : undefined}
                    >
                      <span className={`material-symbols-outlined ${active ? "text-white" : "text-slate-400 group-hover:text-white"}`}>
                        {item.icon}
                      </span>
                      {(!isCollapsed || mobile) && (
                        <span className="text-sm font-medium flex-1">{item.label}</span>
                      )}
                      {(!isCollapsed || mobile) && active && (
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer - Collapse Toggle (Desktop) */}
      {!mobile && (
        <div className="border-t border-slate-800 p-3">
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
