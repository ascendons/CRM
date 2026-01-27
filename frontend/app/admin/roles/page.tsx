"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { rolesService } from "@/lib/roles";
import type { RoleResponse } from "@/types/role";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/EmptyState";
import { AdminRoute } from "@/components/AdminRoute";
import { Plus, Search, Shield, Trash2, Edit, Eye } from "lucide-react";
import { toast } from "react-hot-toast";

export default function RolesPage() {
  return (
    <AdminRoute>
      <RolesPageContent />
    </AdminRoute>
  );
}

function RolesPageContent() {
  const router = useRouter();
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<RoleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  useEffect(() => {
    loadRoles();
  }, [showActiveOnly]);

  useEffect(() => {
    filterRoles();
  }, [roles, searchTerm]);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const data = await rolesService.getAllRoles(showActiveOnly);
      setRoles(data);
    } catch (error) {
      console.error("Failed to load roles:", error);
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  const filterRoles = () => {
    let filtered = [...roles];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (role) =>
          role.roleName.toLowerCase().includes(term) ||
          role.roleId.toLowerCase().includes(term) ||
          role.description?.toLowerCase().includes(term)
      );
    }

    setFilteredRoles(filtered);
  };

  const handleDelete = async (id: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
      return;
    }

    try {
      await rolesService.deleteRole(id);
      toast.success("Role deleted successfully");
      loadRoles();
    } catch (error: any) {
      console.error("Failed to delete role:", error);
      toast.error(error.message || "Failed to delete role");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600 mt-1">Manage hierarchical roles and permissions</p>
        </div>
        <Button
          variant="primary"
          onClick={() => router.push("/admin/roles/new")}
          className="inline-flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Role
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status filter */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Active only</span>
          </label>
        </div>
      </div>

      {/* Roles table */}
      {filteredRoles.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No roles found"
          description={
            searchTerm
              ? "No roles match your search criteria."
              : "Get started by creating your first role."
          }
          action={
            !searchTerm ? (
              <Button variant="primary" onClick={() => router.push("/admin/roles/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hierarchy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Visibility
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRoles.map((role) => (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 rounded-lg">
                        <Shield className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{role.roleName}</div>
                        <div className="text-sm text-gray-500">{role.roleId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Level {role.level}
                      {role.parentRoleName && (
                        <div className="text-xs text-gray-500">
                          Parent: {role.parentRoleName}
                        </div>
                      )}
                      {role.childRoleIds.length > 0 && (
                        <div className="text-xs text-gray-500">
                          {role.childRoleIds.length} child role(s)
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                      {role.permissions.dataVisibility}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        role.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {role.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => router.push(`/admin/roles/${role.id}`)}
                        className="text-gray-600 hover:text-blue-600"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/admin/roles/${role.id}/edit`)}
                        className="text-gray-600 hover:text-blue-600"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(role.id, role.roleName)}
                        className="text-gray-600 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats */}
      {filteredRoles.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredRoles.length} of {roles.length} role(s)
        </div>
      )}
    </div>
  );
}
