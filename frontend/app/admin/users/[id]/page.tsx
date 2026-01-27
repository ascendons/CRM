"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usersService } from "@/lib/users";
import { authService } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import type { UserResponse } from "@/types/user";
import { getUserDisplayName, getUserStatusBadge, isPasswordExpiringSoon } from "@/types/user";
import ConfirmModal from "@/components/ConfirmModal";

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deactivate modal
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [isDeactivating, setIsDeactivating] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const data = await usersService.getUserById(id);
      setUser(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load user";
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = () => {
    setDeactivateReason("");
    setShowDeactivateModal(true);
  };

  const handleDeactivateConfirm = async () => {
    if (!user) return;

    try {
      setIsDeactivating(true);
      await usersService.deactivateUser(user.id, deactivateReason);
      showToast.success("User deactivated successfully");
      setShowDeactivateModal(false);
      router.push("/admin/users");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to deactivate user";
      showToast.error(errorMessage);
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleActivate = async () => {
    if (!user) return;

    try {
      await usersService.activateUser(user.id);
      showToast.success("User activated successfully");
      loadUser();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to activate user";
      showToast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || "User not found"}</p>
          <button
            onClick={() => router.push("/admin/users")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  const DetailSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );

  const DetailRow = ({ label, value }: { label: string; value: string | number | boolean | undefined | null }) => (
    <div className="py-3 border-b border-gray-200 last:border-0">
      <dt className="text-sm font-medium text-gray-500 mb-1">{label}</dt>
      <dd className="text-sm text-gray-900">
        {value !== undefined && value !== null && value !== "" ? String(value) : "-"}
      </dd>
    </div>
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                {user.profile.firstName?.[0]}{user.profile.lastName?.[0]}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{getUserDisplayName(user)}</h1>
                <p className="text-gray-600">@{user.username}</p>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getUserStatusBadge(user.isActive)}`}>
                {user.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">User ID: {user.userId}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/admin/users/${user.id}/edit`)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Edit
            </button>
            {user.isActive ? (
              <button
                onClick={handleDeactivate}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">person_off</span>
                Deactivate
              </button>
            ) : (
              <button
                onClick={handleActivate}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                Activate
              </button>
            )}
            <button
              onClick={() => router.push("/admin/users")}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to List
            </button>
          </div>
        </div>

        {/* Password Warning */}
        {isPasswordExpiringSoon(user.passwordExpiresAt) && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <span className="material-symbols-outlined text-yellow-400">warning</span>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Password expires soon on {new Date(user.passwordExpiresAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <DetailSection title="Basic Information">
            <dl className="divide-y divide-gray-200">
              <DetailRow label="Full Name" value={user.profile.fullName} />
              <DetailRow label="Username" value={user.username} />
              <DetailRow label="Email" value={user.email} />
              <DetailRow label="User ID" value={user.userId} />
              <DetailRow label="Title" value={user.profile.title} />
              <DetailRow label="Department" value={user.profile.department} />
            </dl>
          </DetailSection>

          {/* Role & Access */}
          <DetailSection title="Role & Access">
            <dl className="divide-y divide-gray-200">
              <DetailRow label="Role" value={user.roleName || user.roleId} />
              <DetailRow label="Profile" value={user.profileName || user.profileId} />
              <DetailRow label="Manager" value={user.managerName || "-"} />
              <DetailRow label="Team" value={user.teamName || "-"} />
              <DetailRow label="Territory" value={user.territoryName || "-"} />
            </dl>
          </DetailSection>

          {/* Contact Information */}
          <DetailSection title="Contact Information">
            <dl className="divide-y divide-gray-200">
              <DetailRow label="Phone" value={user.profile.phone} />
              <DetailRow label="Mobile Phone" value={user.profile.mobilePhone} />
              <DetailRow label="Email" value={user.email} />
            </dl>
          </DetailSection>

          {/* Settings */}
          <DetailSection title="Settings">
            <dl className="divide-y divide-gray-200">
              <DetailRow label="Time Zone" value={user.settings.timeZone} />
              <DetailRow label="Language" value={user.settings.language} />
              <DetailRow label="Date Format" value={user.settings.dateFormat} />
              <DetailRow label="Currency" value={user.settings.currency} />
              <DetailRow label="Email Notifications" value={user.settings.emailNotifications ? "Enabled" : "Disabled"} />
              <DetailRow label="Desktop Notifications" value={user.settings.desktopNotifications ? "Enabled" : "Disabled"} />
            </dl>
          </DetailSection>

          {/* Security & Activity */}
          <DetailSection title="Security & Activity">
            <dl className="divide-y divide-gray-200">
              <DetailRow label="Two-Factor Authentication" value={user.security.twoFactorEnabled ? "Enabled" : "Disabled"} />
              <DetailRow label="Last Login" value={formatDate(user.security.lastLoginAt)} />
              <DetailRow label="Last Login IP" value={user.security.lastLoginIP} />
              <DetailRow label="Failed Login Attempts" value={user.security.failedLoginAttempts} />
              <DetailRow label="Password Last Changed" value={formatDate(user.passwordLastChanged)} />
              <DetailRow label="Password Expires" value={formatDate(user.passwordExpiresAt)} />
              {user.security.lockedUntil && (
                <DetailRow label="Account Locked Until" value={formatDate(user.security.lockedUntil)} />
              )}
            </dl>
          </DetailSection>

          {/* System Information */}
          <DetailSection title="System Information">
            <dl className="divide-y divide-gray-200">
              <DetailRow label="Created By" value={user.createdByName || user.createdBy} />
              <DetailRow label="Created At" value={formatDate(user.createdAt)} />
              <DetailRow label="Last Modified By" value={user.lastModifiedByName || user.lastModifiedBy} />
              <DetailRow label="Last Modified At" value={formatDate(user.lastModifiedAt)} />
              {user.deletedAt && (
                <>
                  <DetailRow label="Deactivated At" value={formatDate(user.deletedAt)} />
                  <DetailRow label="Deactivation Reason" value={user.deactivationReason} />
                </>
              )}
            </dl>
          </DetailSection>
        </div>

        {/* Deactivate Modal */}
        <ConfirmModal
          isOpen={showDeactivateModal}
          title="Deactivate User"
          message="Are you sure you want to deactivate this user? They will no longer be able to access the system."
          confirmLabel="Deactivate"
          cancelLabel="Cancel"
          confirmButtonClass="bg-red-500 hover:bg-red-600"
          onConfirm={handleDeactivateConfirm}
          onCancel={() => setShowDeactivateModal(false)}
          isLoading={isDeactivating}
        >
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for deactivation (optional)
            </label>
            <textarea
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter reason..."
            />
          </div>
        </ConfirmModal>
      </div>
    </div>
  );
}
