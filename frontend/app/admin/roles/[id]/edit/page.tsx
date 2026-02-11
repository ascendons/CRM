"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { rolesService } from "@/lib/roles";
import type { RoleResponse } from "@/types/role";
import { Button } from "@/components/ui/button";
import { AdminRoute } from "@/components/AdminRoute";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "react-hot-toast";

export default function EditRolePage() {
  return (
    <AdminRoute>
      <EditRolePageContent />
    </AdminRoute>
  );
}

function EditRolePageContent() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<RoleResponse | null>(null);
  const [roles, setRoles] = useState<RoleResponse[]>([]);

  const [formData, setFormData] = useState({
    roleName: "",
    description: "",
    parentRoleId: "",
    dataVisibility: "OWN" as "OWN" | "SUBORDINATES" | "ALL_USERS" | "ALL",
    canManageUsers: false,
    canManageRoles: false,
    canManageProfiles: false,
    canViewSetup: false,
    canManageSharing: false,
    canViewAllData: false,
    canModifyAllData: false,
    canViewAuditLog: false,
    canExportData: false,
    canImportData: false,
  });

  useEffect(() => {
    loadRole();
    loadRoles();
  }, [roleId]);

  const loadRole = async () => {
    setLoading(true);
    try {
      const data = await rolesService.getRoleById(roleId);
      setRole(data);
      setFormData({
        roleName: data.roleName,
        description: data.description || "",
        parentRoleId: data.parentRoleId || "",
        dataVisibility: data.permissions.dataVisibility,
        canManageUsers: data.permissions.canManageUsers,
        canManageRoles: data.permissions.canManageRoles,
        canManageProfiles: data.permissions.canManageProfiles,
        canViewSetup: data.permissions.canViewSetup,
        canManageSharing: data.permissions.canManageSharing,
        canViewAllData: data.permissions.canViewAllData,
        canModifyAllData: data.permissions.canModifyAllData,
        canViewAuditLog: data.permissions.canViewAuditLog,
        canExportData: data.permissions.canExportData,
        canImportData: data.permissions.canImportData,
      });
    } catch (error) {
      console.error("Failed to load role:", error);
      toast.error("Failed to load role");
      router.push("/admin/roles");
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await rolesService.getAllRoles(true);
      setRoles(data.filter((r) => r.id !== roleId));
    } catch (error) {
      console.error("Failed to load roles:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData = {
        roleName: formData.roleName,
        description: formData.description,
        parentRoleId: formData.parentRoleId || undefined,
        permissions: {
          dataVisibility: formData.dataVisibility,
          canManageUsers: formData.canManageUsers,
          canManageRoles: formData.canManageRoles,
          canManageProfiles: formData.canManageProfiles,
          canViewSetup: formData.canViewSetup,
          canManageSharing: formData.canManageSharing,
          canViewAllData: formData.canViewAllData,
          canModifyAllData: formData.canModifyAllData,
          canViewAuditLog: formData.canViewAuditLog,
          canExportData: formData.canExportData,
          canImportData: formData.canImportData,
        },
      };

      await rolesService.updateRole(roleId, updateData);
      toast.success("Role updated successfully");
      router.push("/admin/roles");
    } catch (error: any) {
      console.error("Failed to update role:", error);
      toast.error(error.message || "Failed to update role");
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
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Roles
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Role</h1>
        <p className="text-gray-600 mt-1">{role.roleId} - {role.roleName}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.roleName}
                onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Regional Sales Manager"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the responsibilities and scope of this role..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Role (Optional)
              </label>
              <select
                value={formData.parentRoleId}
                onChange={(e) => setFormData({ ...formData, parentRoleId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">None (Root Role)</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.roleId}>
                    {r.roleName}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Roles inherit permissions from their parent role
              </p>
            </div>
          </div>
        </div>

        {/* Data Visibility */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Visibility</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What data can users with this role see?
            </label>
            <div className="space-y-2">
              {[
                { value: "OWN", label: "Own Records Only", desc: "Can only see records they own" },
                { value: "SUBORDINATES", label: "Own + Subordinates", desc: "Can see their own records and those of their subordinates" },
                { value: "ALL_USERS", label: "All Users", desc: "Can see all users' records" },
                { value: "ALL", label: "All Records", desc: "Can see all records in the system" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.dataVisibility === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="dataVisibility"
                    value={option.value}
                    checked={formData.dataVisibility === option.value}
                    onChange={(e) => setFormData({ ...formData, dataVisibility: e.target.value as any })}
                    className="mt-1"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* System Permissions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Administrative Capabilities</h2>

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
              <label
                key={perm.key}
                className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={formData[perm.key as keyof typeof formData] as boolean}
                  onChange={(e) => setFormData({ ...formData, [perm.key]: e.target.checked })}
                  className="mt-1"
                />
                <div className="ml-3">
                  <div className="font-medium text-gray-900">{perm.label}</div>
                  <div className="text-sm text-gray-600">{perm.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/roles/${roleId}/permissions`)}
          >
            Manage Module Permissions →
          </Button>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={saving || !formData.roleName}
              className="inline-flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
