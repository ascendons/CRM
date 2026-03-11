'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { profilesService } from '@/lib/profiles';
import type { ObjectPermission, SystemPermissions, CreateProfileRequest } from '@/types/profile';
import { AdminRoute } from '@/components/AdminRoute';
import { ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Available objects in the system
const AVAILABLE_OBJECTS = [
  'USER', 'ROLE', 'PROFILE', 'LEAD', 'OPPORTUNITY', 'CONTACT', 'ACCOUNT',
  'ACTIVITY', 'PROPOSAL', 'PRODUCT', 'ATTENDANCE', 'SHIFT', 'LEAVE', 'HOLIDAY', 'LOCATION'
];

export default function NewProfilePage() {
  return (
    <AdminRoute>
      <NewProfileContent />
    </AdminRoute>
  );
}

function NewProfileContent() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Form state
  const [profileName, setProfileName] = useState('');
  const [description, setDescription] = useState('');
  const [objectPermissions, setObjectPermissions] = useState<ObjectPermission[]>(
    AVAILABLE_OBJECTS.map((obj) => ({
      objectName: obj,
      canCreate: false,
      canRead: false,
      canEdit: false,
      canDelete: false,
      canViewAll: false,
      canModifyAll: false,
    }))
  );
  const [systemPermissions, setSystemPermissions] = useState<SystemPermissions>({
    canAccessAPI: false,
    apiRateLimit: 100,
    canAccessMobileApp: true,
    canAccessReports: true,
    canAccessDashboards: true,
    canBulkUpdate: false,
    canBulkDelete: false,
    canMassEmail: false,
    canBypassValidation: false,
    canRunApex: false,
  });

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

  const handleSelectAll = (objectName: string, selected: boolean) => {
    setObjectPermissions((prev) =>
      prev.map((perm) =>
        perm.objectName === objectName
          ? {
              ...perm,
              canCreate: selected,
              canRead: selected,
              canEdit: selected,
              canDelete: selected,
              canViewAll: selected,
              canModifyAll: selected,
            }
          : perm
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileName.trim()) {
      toast.error('Profile name is required');
      return;
    }

    try {
      setSaving(true);
      const request: CreateProfileRequest = {
        profileName: profileName.trim(),
        description: description.trim() || undefined,
        objectPermissions,
        systemPermissions,
      };

      const response = await profilesService.createProfile(request);
      toast.success('Profile created successfully');
      router.push(`/admin/profiles/${response.id}`);
    } catch (error: any) {
      console.error('Failed to create profile:', error);
      toast.error(error.message || 'Failed to create profile');
    } finally {
      setSaving(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Create New Profile</h1>
            <p className="text-gray-600 mt-1">Define permissions for a new user profile</p>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          {saving ? 'Creating...' : 'Create Profile'}
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
              placeholder="e.g., Sales Representative, Marketing Manager"
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
              placeholder="Describe the purpose and scope of this profile"
            />
          </div>
        </div>
      </div>

      {/* Object Permissions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Object Permissions</h2>
        <p className="text-sm text-gray-600 mb-4">
          Configure CRUD permissions for each object type
        </p>
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
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">All</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {objectPermissions.map((perm) => {
                const allSelected =
                  perm.canCreate &&
                  perm.canRead &&
                  perm.canEdit &&
                  perm.canDelete &&
                  perm.canViewAll &&
                  perm.canModifyAll;

                return (
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
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => handleSelectAll(perm.objectName, e.target.checked)}
                        className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Permissions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Permissions</h2>
        <p className="text-sm text-gray-600 mb-4">
          Configure system-level capabilities and access
        </p>
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
          {saving ? 'Creating...' : 'Create Profile'}
        </button>
      </div>
    </form>
  );
}
