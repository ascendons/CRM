"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { profilesService } from "@/lib/profiles";
import type { ProfileResponse } from "@/types/profile";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { AdminRoute } from "@/components/AdminRoute";
import { Plus, Search, FileText, Trash2, Edit, Eye } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ProfilesPage() {
  return (
    <AdminRoute>
      <ProfilesPageContent />
    </AdminRoute>
  );
}

function ProfilesPageContent() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileResponse[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<ProfileResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, [showActiveOnly]);

  useEffect(() => {
    filterProfiles();
  }, [profiles, searchTerm]);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const data = await profilesService.getAllProfiles(showActiveOnly);
      setProfiles(data);
    } catch (error) {
      console.error("Failed to load profiles:", error);
      toast.error("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  };

  const filterProfiles = () => {
    let filtered = [...profiles];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (profile) =>
          profile.profileName.toLowerCase().includes(term) ||
          profile.profileId.toLowerCase().includes(term) ||
          profile.description?.toLowerCase().includes(term)
      );
    }

    setFilteredProfiles(filtered);
  };

  const handleDelete = async (id: string, profileName: string) => {
    if (!confirm(`Are you sure you want to delete the profile "${profileName}"?`)) {
      return;
    }

    try {
      await profilesService.deleteProfile(id);
      toast.success("Profile deleted successfully");
      loadProfiles();
    } catch (error: any) {
      console.error("Failed to delete profile:", error);
      toast.error(error.message || "Failed to delete profile");
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
          <h1 className="text-2xl font-bold text-gray-900">Profile Management</h1>
          <p className="text-gray-600 mt-1">Manage object, field, and system permissions</p>
        </div>
        <Button
          variant="default"
          onClick={() => router.push("/admin/profiles/new")}
          className="inline-flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Profile
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

      {/* Profiles table */}
      {filteredProfiles.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No profiles found"
          description={
            searchTerm
              ? "No profiles match your search criteria."
              : "Get started by creating your first profile."
          }
          action={undefined}
          customAction={
            !searchTerm ? (
              <Button variant="default" onClick={() => router.push("/admin/profiles/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Profile
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
                  Profile
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  API Access
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
              {filteredProfiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-indigo-100 rounded-lg">
                        <FileText className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {profile.profileName}
                        </div>
                        <div className="text-sm text-gray-500">{profile.profileId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {profile.objectPermissions.length} object(s)
                      {profile.fieldPermissions.length > 0 && (
                        <div className="text-xs text-gray-500">
                          {profile.fieldPermissions.length} field permission(s)
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {profile.systemPermissions.canAccessAPI ? (
                        <span className="text-green-600">
                          Enabled ({profile.systemPermissions.apiRateLimit}/min)
                        </span>
                      ) : (
                        <span className="text-gray-500">Disabled</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${profile.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                        }`}
                    >
                      {profile.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => router.push(`/admin/profiles/${profile.id}`)}
                        className="text-gray-600 hover:text-blue-600"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/admin/profiles/${profile.id}/edit`)}
                        className="text-gray-600 hover:text-blue-600"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(profile.id, profile.profileName)}
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
      {filteredProfiles.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredProfiles.length} of {profiles.length} profile(s)
        </div>
      )}
    </div>
  );
}
