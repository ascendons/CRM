"use client";

import { useRouter } from "next/navigation";
import { AdminRoute } from "@/components/AdminRoute";
import { Users, Shield, FileText, Settings, Database, Lock } from "lucide-react";

export default function AdminPage() {
  return (
    <AdminRoute>
      <AdminPageContent />
    </AdminRoute>
  );
}

function AdminPageContent() {
  const router = useRouter();

  const adminSections = [
    {
      title: "User Management",
      description: "Manage users, create accounts, assign roles and profiles",
      icon: Users,
      color: "bg-blue-500",
      href: "/admin/users",
      permissions: "Requires: User Read permission",
    },
    {
      title: "Role Management",
      description: "Configure hierarchical roles and data visibility settings",
      icon: Shield,
      color: "bg-purple-500",
      href: "/admin/roles",
      permissions: "Requires: Role Read permission",
    },
    {
      title: "Profile Management",
      description: "Define object, field, and system permissions",
      icon: FileText,
      color: "bg-indigo-500",
      href: "/admin/profiles",
      permissions: "Requires: Profile Read permission",
    },
    {
      title: "System Settings",
      description: "Configure global system settings and preferences",
      icon: Settings,
      color: "bg-gray-500",
      href: "/admin/settings",
      permissions: "Requires: System Admin permission",
      comingSoon: true,
    },
    {
      title: "Data Management",
      description: "Import, export, and manage system data",
      icon: Database,
      color: "bg-green-500",
      href: "/admin/data",
      permissions: "Requires: Data Management permission",
      comingSoon: true,
    },
    {
      title: "Security & Audit",
      description: "View audit logs, security settings, and access history",
      icon: Lock,
      color: "bg-red-500",
      href: "/admin/security",
      permissions: "Requires: Audit Log permission",
      comingSoon: true,
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Administration</h1>
        <p className="text-gray-600">
          Manage users, roles, permissions, and system settings
        </p>
      </div>

      {/* Admin Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.href}
              onClick={() => !section.comingSoon && router.push(section.href)}
              disabled={section.comingSoon}
              className={`relative bg-white rounded-lg border-2 border-gray-200 p-6 text-left transition-all hover:border-blue-300 hover:shadow-lg ${
                section.comingSoon ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {/* Coming Soon Badge */}
              {section.comingSoon && (
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                    Coming Soon
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-12 h-12 ${section.color} rounded-lg mb-4`}>
                <Icon className="h-6 w-6 text-white" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {section.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-3">
                {section.description}
              </p>

              {/* Permissions */}
              <p className="text-xs text-gray-500 italic">
                {section.permissions}
              </p>
            </button>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-900">
              Role-Based Access Control (RBAC)
            </h3>
            <div className="mt-2 text-sm text-blue-800">
              <p className="mb-2">
                This CRM uses a comprehensive permission system with three layers:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong>Roles</strong>: Define hierarchy and data visibility (who can see what records)
                </li>
                <li>
                  <strong>Profiles</strong>: Define object/field permissions (what actions users can perform)
                </li>
                <li>
                  <strong>Record-Level</strong>: Ownership and sharing rules (granular access control)
                </li>
              </ul>
              <p className="mt-3 text-xs">
                Every user must be assigned both a role and a profile. The first user is automatically
                assigned System Administrator role and profile with full access.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
