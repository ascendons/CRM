'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { permissionsApi, EffectivePermissionsResponse } from '@/lib/api/permissions';
import { ModuleSection } from '@/components/permissions/ModuleSection';
import { ArrowLeft, RefreshCw, Search, Shield, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UserPermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [permissions, setPermissions] = useState<EffectivePermissionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPermissions();
  }, [userId]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const data = await permissionsApi.getEffectivePermissions(userId);
      setPermissions(data);
    } catch (error: any) {
      console.error('Failed to load permissions:', error);
      toast.error(error.message || 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPermissions();
    setRefreshing(false);
    toast.success('Permissions refreshed');
  };

  const handleGrant = async (objectName: string, action: string, reason?: string) => {
    try {
      await permissionsApi.grantPermission(userId, {
        objectName,
        action,
        reason
      });
      toast.success(`Granted ${action} on ${objectName}`);
      await loadPermissions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to grant permission');
      throw error;
    }
  };

  const handleRevoke = async (objectName: string, action: string, reason?: string) => {
    try {
      await permissionsApi.revokePermission(userId, {
        objectName,
        action,
        reason
      });
      toast.success(`Revoked ${action} on ${objectName}`);
      await loadPermissions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to revoke permission');
      throw error;
    }
  };

  // Filter modules based on search query
  const filteredModules = permissions?.modules.filter(module => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      module.displayName.toLowerCase().includes(query) ||
      module.objects.some(obj =>
        obj.displayName.toLowerCase().includes(query) ||
        Object.keys(obj.permissions).some(action =>
          action.toLowerCase().includes(query)
        )
      )
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!permissions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Failed to load permissions</p>
          <button
            onClick={loadPermissions}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-gray-400" />
              <h1 className="text-2xl font-bold text-gray-900">
                User Permissions
              </h1>
            </div>
            <p className="text-gray-600 mt-1">
              {permissions.userName} ({permissions.userEmail})
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">Base Profile</h3>
            <p className="text-lg font-bold text-blue-600">{permissions.profileName}</p>
            <p className="text-xs text-gray-500 mt-1">Profile ID: {permissions.profileId}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">User Overrides</p>
            <p className="text-2xl font-bold text-gray-900">{permissions.overrides.length}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search permissions, objects, or actions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Permission Legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-3">Permission Status Legend</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-700">
              <strong>FROM PROFILE:</strong> Inherited from profile
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-green-600 rounded-full" />
            <span className="text-sm text-blue-700">
              <strong>USER GRANT:</strong> User-specific override (granted)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-red-600 rounded-full" />
            <span className="text-sm text-blue-700">
              <strong>USER DENY:</strong> User-specific override (denied)
            </span>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-6">
        {filteredModules && filteredModules.length > 0 ? (
          filteredModules.map((module) => (
            <ModuleSection
              key={module.moduleName}
              module={module}
              onGrant={handleGrant}
              onRevoke={handleRevoke}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No permissions found matching "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* User Overrides Summary */}
      {permissions.overrides.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">User-Specific Overrides</h3>
          <div className="space-y-2">
            {permissions.overrides.map((override, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <span className="font-semibold text-gray-900">
                    {override.action}
                  </span>
                  <span className="text-gray-500 mx-2">on</span>
                  <span className="font-semibold text-gray-900">
                    {override.objectName}
                  </span>
                  {override.reason && (
                    <p className="text-xs text-gray-500 mt-1">
                      Reason: {override.reason}
                    </p>
                  )}
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>By: {override.grantedByName}</p>
                  {override.grantedAt && (
                    <p>{new Date(override.grantedAt).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
