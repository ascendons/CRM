"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { profilesService } from "@/lib/profiles";
import { usersService } from "@/lib/users";
import type { ProfileResponse } from "@/types/profile";
import type { UserResponse } from "@/types/user";
import { AdminRoute } from "@/components/AdminRoute";
import { ArrowLeft, Edit, Shield, Users, Lock, Database, Eye } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ProfileDetailPage() {
  return (
    <AdminRoute>
      <ProfileDetailContent />
    </AdminRoute>
  );
}

function ProfileDetailContent() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id as string;

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    loadProfile();
    loadAssignedUsers();
  }, [profileId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await profilesService.getProfileById(profileId);
      setProfile(data);
    } catch (error: any) {
      console.error("Failed to load profile:", error);
      toast.error(error.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const loadAssignedUsers = async () => {
    try {
      setLoadingUsers(true);
      const allUsers = await usersService.getAllUsers();
      // Filter users assigned to this profile
      const assignedUsers = allUsers.filter((u) => u.profileId === profile?.profileId);
      setUsers(assignedUsers);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-600">Profile not found</p>
          <button
            onClick={() => router.push("/admin/profiles")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Profiles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.profileName}</h1>
            <p className="text-gray-600 mt-1">{profile.description || "No description"}</p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/admin/profiles/${profileId}/edit`)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </button>
      </div>

      {/* Profile Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Profile ID</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">{profile.profileId}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Assigned Users</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">{users.length}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <span className="text-sm font-medium">Status</span>
            </div>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                profile.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
              }`}
            >
              {profile.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Object Permissions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Object Permissions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Object
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Create
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Read
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Edit
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Delete
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  View All
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Modify All
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {profile.objectPermissions.map((perm) => (
                <tr key={perm.objectName} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{perm.objectName}</td>
                  <td className="px-4 py-3 text-center">
                    {perm.canCreate ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {perm.canRead ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {perm.canEdit ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {perm.canDelete ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {perm.canViewAll ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {perm.canModifyAll ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Permissions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">System Permissions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(profile.systemPermissions).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">{key.replace(/([A-Z])/g, " $1").trim()}</span>
              {typeof value === "boolean" ? (
                value ? (
                  <span className="text-green-600 font-semibold">✓</span>
                ) : (
                  <span className="text-gray-300">-</span>
                )
              ) : (
                <span className="text-sm font-semibold text-gray-900">{value}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Assigned Users */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Assigned Users ({users.length})</h2>
        </div>
        {loadingUsers ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : users.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No users assigned to this profile</p>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                    {user.profile.firstName?.[0]}
                    {user.profile.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.profile.firstName} {user.profile.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/admin/users/${user.userId}/permissions`)}
                  className="text-blue-600 hover:text-blue-800"
                  title="View user permissions"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
