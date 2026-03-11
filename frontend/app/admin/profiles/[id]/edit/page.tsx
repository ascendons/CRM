'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { profilesService } from '@/lib/profiles';
import type { ProfileResponse, ObjectPermission, SystemPermissions, UpdateProfileRequest } from '@/types/profile';
import { AdminRoute } from '@/components/AdminRoute';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

// All available objects in the system (must match backend)
const ALL_OBJECTS = [
  'USER', 'ROLE', 'PROFILE', 'LEAD', 'OPPORTUNITY', 'CONTACT', 'ACCOUNT',
  'ACTIVITY', 'PROPOSAL', 'PRODUCT', 'ATTENDANCE', 'SHIFT', 'LEAVE', 'HOLIDAY', 'LOCATION'
];

export default function ProfileEditPage() {
  return (
    <AdminRoute>
      <ProfileEditContent />
    </AdminRoute>
  );
}

function ProfileEditContent() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  // Form state
  const [profileName, setProfileName] = useState('');
  const [description, setDescription] = useState('');
  const [objectPermissions, setObjectPermissions] = useState<ObjectPermission[]>([]);
  const [systemPermissions, setSystemPermissions] = useState<SystemPermissions>({
    canAccessAPI: false,
    apiRateLimit: 100,
    canAccessMobileApp: false,
    canAccessReports: false,
    canAccessDashboards: false,
    canBulkUpdate: false,
    canBulkDelete: false,
    canMassEmail: false,
    canBypassValidation: false,
    canRunApex: false,
  });

  useEffect(() => {
    loadProfile();
  }, [profileId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await profilesService.getProfileById(profileId);
      setProfile(data);
      setProfileName(data.profileName);
      setDescription(data.description || '');

      // Merge existing permissions with all objects to ensure completeness
      const existingPerms = data.objectPermissions || [];
      const existingObjectNames = existingPerms.map(p => p.objectName);

      // Add missing objects with default permissions
      const completePermissions = ALL_OBJECTS.map(objectName => {
        const existing = existingPerms.find(p => p.objectName === objectName);
        if (existing) {
          return existing;
        }
        // Default permissions for missing objects
        return {
          objectName,
          canCreate: false,
          canRead: false,
          canEdit: false,
          canDelete: false,
          canViewAll: false,
          canModifyAll: false,
        };
      });

      setObjectPermissions(completePermissions);
      setSystemPermissions(data.systemPermissions);
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      toast.error(error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleObjectPermissionChange = (
    objectName: string,
    field: keyof ObjectPermission,
    value: boolean
  ) => {
    setObjectPermissions((prev) =>
      prev.map((perm) =>
        perm.objectName === objectName ? { ...perm, [field]: value } : perm
      )
    );
  };

  const handleSystemPermissionChange = (
    field: keyof SystemPermissions,
    value: boolean | number
  ) => {
    setSystemPermissions((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileName.trim()) {
      toast.error('Profile name is required');
      return;
    }

    try {
      setSaving(true);
      const request: UpdateProfileRequest = {
        profileName: profileName.trim(),
        description: description.trim() || undefined,
        objectPermissions,
        systemPermissions,
      };

      await profilesService.updateProfile(profileId, request);
      toast.success('Profile updated successfully');
      router.push(`/admin/profiles/${profileId}`);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.message || 'Failed to update profile');
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

  if (!profile) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-600">Profile not found</p>
          <button
            onClick={() => router.push('/admin/profiles')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Profiles
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-gray-600 mt-1">Update profile details and permissions</p>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Name *
            </label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter profile name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter profile description"
            />
          </div>
        </div>
      </div>

      {/* Object Permissions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Object Permissions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Object</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Create</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Read</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Edit</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Delete</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">View All</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Modify All</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {objectPermissions.map((perm) => (
                <tr key={perm.objectName} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{perm.objectName}</td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={perm.canCreate}
                      onChange={(e) =>
                        handleObjectPermissionChange(perm.objectName, 'canCreate', e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={perm.canRead}
                      onChange={(e) =>
                        handleObjectPermissionChange(perm.objectName, 'canRead', e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={perm.canEdit}
                      onChange={(e) =>
                        handleObjectPermissionChange(perm.objectName, 'canEdit', e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={perm.canDelete}
                      onChange={(e) =>
                        handleObjectPermissionChange(perm.objectName, 'canDelete', e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={perm.canViewAll}
                      onChange={(e) =>
                        handleObjectPermissionChange(perm.objectName, 'canViewAll', e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={perm.canModifyAll}
                      onChange={(e) =>
                        handleObjectPermissionChange(perm.objectName, 'canModifyAll', e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Permissions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Permissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <label htmlFor="canAccessAPI" className="text-sm text-gray-700">
              Can Access API
            </label>
            <input
              type="checkbox"
              id="canAccessAPI"
              checked={systemPermissions.canAccessAPI}
              onChange={(e) => handleSystemPermissionChange('canAccessAPI', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          </div>

          {systemPermissions.canAccessAPI && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <label htmlFor="apiRateLimit" className="text-sm text-gray-700">
                API Rate Limit (per minute)
              </label>
              <input
                type="number"
                id="apiRateLimit"
                value={systemPermissions.apiRateLimit}
                onChange={(e) =>
                  handleSystemPermissionChange('apiRateLimit', parseInt(e.target.value) || 100)
                }
                min="1"
                max="10000"
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <label htmlFor="canAccessMobileApp" className="text-sm text-gray-700">
              Can Access Mobile App
            </label>
            <input
              type="checkbox"
              id="canAccessMobileApp"
              checked={systemPermissions.canAccessMobileApp}
              onChange={(e) =>
                handleSystemPermissionChange('canAccessMobileApp', e.target.checked)
              }
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <label htmlFor="canAccessReports" className="text-sm text-gray-700">
              Can Access Reports
            </label>
            <input
              type="checkbox"
              id="canAccessReports"
              checked={systemPermissions.canAccessReports}
              onChange={(e) => handleSystemPermissionChange('canAccessReports', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <label htmlFor="canAccessDashboards" className="text-sm text-gray-700">
              Can Access Dashboards
            </label>
            <input
              type="checkbox"
              id="canAccessDashboards"
              checked={systemPermissions.canAccessDashboards}
              onChange={(e) =>
                handleSystemPermissionChange('canAccessDashboards', e.target.checked)
              }
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <label htmlFor="canBulkUpdate" className="text-sm text-gray-700">
              Can Bulk Update
            </label>
            <input
              type="checkbox"
              id="canBulkUpdate"
              checked={systemPermissions.canBulkUpdate}
              onChange={(e) => handleSystemPermissionChange('canBulkUpdate', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <label htmlFor="canBulkDelete" className="text-sm text-gray-700">
              Can Bulk Delete
            </label>
            <input
              type="checkbox"
              id="canBulkDelete"
              checked={systemPermissions.canBulkDelete}
              onChange={(e) => handleSystemPermissionChange('canBulkDelete', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <label htmlFor="canMassEmail" className="text-sm text-gray-700">
              Can Mass Email
            </label>
            <input
              type="checkbox"
              id="canMassEmail"
              checked={systemPermissions.canMassEmail}
              onChange={(e) => handleSystemPermissionChange('canMassEmail', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <label htmlFor="canBypassValidation" className="text-sm text-gray-700">
              Can Bypass Validation
            </label>
            <input
              type="checkbox"
              id="canBypassValidation"
              checked={systemPermissions.canBypassValidation}
              onChange={(e) =>
                handleSystemPermissionChange('canBypassValidation', e.target.checked)
              }
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <label htmlFor="canRunApex" className="text-sm text-gray-700">
              Can Run Apex
            </label>
            <input
              type="checkbox"
              id="canRunApex"
              checked={systemPermissions.canRunApex}
              onChange={(e) => handleSystemPermissionChange('canRunApex', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
