"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { shiftsApi, ShiftResponse } from "@/lib/api/shifts";
import { usersService } from "@/lib/users";
import { api } from "@/lib/api-client";
import { showToast } from "@/lib/toast";
import type { UserResponse } from "@/types/user";

interface BulkShiftAssignmentRequest {
  userIds: string[];
  shiftId: string;
  officeLocationId?: string;
  effectiveDate: string;
  endDate?: string;
  isTemporary?: boolean;
  reason?: string;
}

export default function AssignShiftPage() {
  const router = useRouter();
  const [shifts, setShifts] = useState<ShiftResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<BulkShiftAssignmentRequest>({
    userIds: [],
    shiftId: "",
    effectiveDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [shiftsData, usersData] = await Promise.all([
        shiftsApi.getActiveShifts(),
        usersService.getActiveUsers(),
      ]);
      setShifts(shiftsData);
      setUsers(usersData);
    } catch (err) {
      showToast.error("Failed to load data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedUsers.length === 0) {
      showToast.error("Please select at least one user");
      return;
    }

    if (!formData.shiftId) {
      showToast.error("Please select a shift");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        userIds: selectedUsers,
      };

      await api.post("/admin/bulk/assign-shift", payload);
      showToast.success(`Shift assigned to ${selectedUsers.length} user(s) successfully`);
      router.push("/admin/attendance/shifts");
    } catch (err: any) {
      showToast.error(err.message || "Failed to assign shift");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-50 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Assign Shift to Users</h1>
          <p className="mt-2 text-gray-600">Select users and assign them to a shift schedule</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Select Users ({selectedUsers.length} selected)
                </h2>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedUsers.length === users.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {users.length === 0 ? (
                  <p className="text-gray-500 text-sm">No active users found</p>
                ) : (
                  users.map((user) => (
                    <label
                      key={user.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedUsers.includes(user.id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleUserToggle(user.id)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {user.profile?.fullName || user.username}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Shift Configuration */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Shift Details</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Shift <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.shiftId}
                  onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a shift...</option>
                  {shifts.map((shift) => (
                    <option key={shift.id} value={shift.shiftId}>
                      {shift.name} ({shift.code || shift.shiftId})
                    </option>
                  ))}
                </select>
                {shifts.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    No shifts available. Please create a shift first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Effective Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  When should this shift assignment start?
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.endDate || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value || undefined })
                  }
                  min={formData.effectiveDate}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for ongoing assignment</p>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isTemporary || false}
                    onChange={(e) => setFormData({ ...formData, isTemporary: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">Temporary Assignment</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={formData.reason || ""}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Temporary project assignment, Department change, etc."
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          {selectedUsers.length > 0 && formData.shiftId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-600">info</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    You are about to assign{" "}
                    <span className="font-bold">
                      {shifts.find((s) => s.shiftId === formData.shiftId)?.name}
                    </span>{" "}
                    to <span className="font-bold">{selectedUsers.length}</span> user(s)
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Effective from: {new Date(formData.effectiveDate).toLocaleDateString()}
                    {formData.endDate &&
                      ` until ${new Date(formData.endDate).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                submitting || selectedUsers.length === 0 || !formData.shiftId || shifts.length === 0
              }
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {submitting ? "Assigning..." : `Assign Shift to ${selectedUsers.length} User(s)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
