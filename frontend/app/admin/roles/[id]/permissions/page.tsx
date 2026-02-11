"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { rolesService } from "@/lib/roles";
import type { RoleResponse, ModulePermissionResponse, ModuleDefinitionResponse } from "@/types/role";
import { Button } from "@/components/ui/button";
import { AdminRoute } from "@/components/AdminRoute";
import { ArrowLeft, Save, Shield } from "lucide-react";
import { toast } from "react-hot-toast";

export default function RolePermissionsPage() {
  return (
    <AdminRoute>
      <RolePermissionsPageContent />
    </AdminRoute>
  );
}

function RolePermissionsPageContent() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<RoleResponse | null>(null);
  const [availableModules, setAvailableModules] = useState<ModuleDefinitionResponse[]>([]);
  const [modulePermissions, setModulePermissions] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"modules" | "objects" | "system">("modules");

  useEffect(() => {
    loadRoleAndPermissions();
  }, [roleId]);

  const loadRoleAndPermissions = async () => {
    setLoading(true);
    try {
      // Load role details
      const roleData = await rolesService.getRoleById(roleId);
      setRole(roleData);

      // Load available modules
      const modules = await rolesService.getAvailableModules();
      setAvailableModules(modules);

      // Load current module permissions
      const currentPermissions = await rolesService.getModulePermissions(roleId);

      // Build permission map
      const permissionMap: Record<string, boolean> = {};
      modules.forEach((module) => {
        const existing = currentPermissions.find(
          (p) => p.moduleName === module.moduleName
        );
        permissionMap[module.moduleName] = existing?.canAccess ?? false;
      });

      setModulePermissions(permissionMap);
    } catch (error) {
      console.error("Failed to load permissions:", error);
      toast.error("Failed to load role permissions");
      router.push("/admin/roles");
    } finally {
      setLoading(false);
    }
  };

  const handleModuleToggle = (moduleName: string) => {
    setModulePermissions((prev) => ({
      ...prev,
      [moduleName]: !prev[moduleName],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build module permissions array
      const permissions = availableModules.map((module) => ({
        moduleName: module.moduleName,
        displayName: module.displayName,
        canAccess: modulePermissions[module.moduleName] ?? false,
        includedPaths: module.includedPaths,
        description: module.description,
      }));

      await rolesService.updateModulePermissions(roleId, {
        modulePermissions: permissions,
      });

      toast.success("Permissions updated successfully");
      router.push("/admin/roles");
    } catch (error: any) {
      console.error("Failed to update permissions:", error);
      toast.error(error.message || "Failed to update permissions");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!role) {
    return null;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/admin/roles")}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Roles
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Permissions</h1>
            <p className="text-gray-600 mt-1">
              {role.roleId} - {role.roleName}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/roles/${roleId}/edit`)}
            >
              Edit Role Details
            </Button>
            <Button
              variant="default"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Permissions"}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("modules")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "modules"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Module Access
            </button>
            <button
              onClick={() => setActiveTab("objects")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "objects"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Object Permissions
            </button>
            <button
              onClick={() => setActiveTab("system")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "system"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              System Capabilities
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "modules" && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Module Access Control</h2>
            <p className="text-sm text-gray-600 mt-1">
              Select which modules users with this role can access. Each module includes multiple related pages.
            </p>
          </div>

          <div className="space-y-3">
            {availableModules.map((module) => (
              <label
                key={module.moduleName}
                className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                  modulePermissions[module.moduleName]
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={modulePermissions[module.moduleName] ?? false}
                  onChange={() => handleModuleToggle(module.moduleName)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{module.displayName}</div>
                      <div className="text-sm text-gray-600 mt-1">{module.description}</div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        modulePermissions[module.moduleName]
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {modulePermissions[module.moduleName] ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs text-gray-500">Included pages:</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {module.includedPaths.map((path) => (
                        <code
                          key={path}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          {path}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {availableModules.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No modules available</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "objects" && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Object-Level Permissions</h2>
            <p className="text-sm text-gray-600 mt-1">
              Object permissions are configured via the Profile. Go to Profile Management to set CRUD permissions.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Object-level permissions (Create, Read, Update, Delete) are managed at the{" "}
              <strong>Profile</strong> level, not at the Role level. Roles control module access, while Profiles
              control what actions users can perform on specific objects.
            </p>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Object
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Create
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Read
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Update
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delete
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {["Lead", "Contact", "Account", "Opportunity", "Activity", "Product", "Proposal"].map((obj) => (
                  <tr key={obj} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{obj}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      <span className="text-gray-400">Via Profile</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      <span className="text-gray-400">Via Profile</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      <span className="text-gray-400">Via Profile</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      <span className="text-gray-400">Via Profile</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <Button variant="outline" onClick={() => router.push("/admin/profiles")}>
              Go to Profile Management →
            </Button>
          </div>
        </div>
      )}

      {activeTab === "system" && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">System Capabilities</h2>
            <p className="text-sm text-gray-600 mt-1">
              System permissions are configured in the role details. Go back to edit the role to modify these.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> System-level permissions (like "Manage Users", "Export Data") are configured
              when creating or editing a role.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { key: "canManageUsers", label: "Manage Users", desc: "Create, edit, and deactivate users" },
              { key: "canManageRoles", label: "Manage Roles", desc: "Create and modify role definitions" },
              { key: "canManageProfiles", label: "Manage Profiles", desc: "Configure user profiles and permissions" },
              { key: "canViewSetup", label: "View Setup", desc: "Access system setup and configuration" },
              { key: "canManageSharing", label: "Manage Sharing", desc: "Configure sharing rules and settings" },
              { key: "canViewAllData", label: "View All Data", desc: "Bypass sharing rules to view all data" },
              { key: "canModifyAllData", label: "Modify All Data", desc: "Edit all records regardless of ownership" },
              { key: "canViewAuditLog", label: "View Audit Log", desc: "Access system audit logs" },
              { key: "canExportData", label: "Export Data", desc: "Export data to CSV/Excel" },
              { key: "canImportData", label: "Import Data", desc: "Import data from files" },
            ].map((perm) => (
              <div key={perm.key} className="flex items-start p-4 border border-gray-200 rounded-lg bg-gray-50">
                <input
                  type="checkbox"
                  checked={role.permissions[perm.key as keyof typeof role.permissions] as boolean}
                  disabled
                  className="mt-1 h-4 w-4 text-gray-400 border-gray-300 rounded"
                />
                <div className="ml-4">
                  <div className="font-medium text-gray-900">{perm.label}</div>
                  <div className="text-sm text-gray-600">{perm.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Button variant="outline" onClick={() => router.push(`/admin/roles/${roleId}/edit`)}>
              Edit System Capabilities →
            </Button>
          </div>
        </div>
      )}

      {/* Summary Card */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Permission Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Accessible Modules</div>
            <div className="text-lg font-semibold text-blue-600">
              {Object.values(modulePermissions).filter(Boolean).length} / {availableModules.length}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Data Visibility</div>
            <div className="text-lg font-semibold text-purple-600">
              {role.permissions.dataVisibility}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Admin Capabilities</div>
            <div className="text-lg font-semibold text-green-600">
              {[
                role.permissions.canManageUsers,
                role.permissions.canManageRoles,
                role.permissions.canExportData,
                role.permissions.canImportData,
              ].filter(Boolean).length}{" "}
              enabled
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
