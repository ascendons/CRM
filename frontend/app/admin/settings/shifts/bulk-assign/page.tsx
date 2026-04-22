"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { shiftsApi, ShiftResponse } from "@/lib/api/shifts";
import { locationsApi, LocationResponse } from "@/lib/api/locations";
import { api } from "@/lib/api-client";
import { toast } from "react-hot-toast";
import { ArrowLeft, Users, Calendar, MapPin, Building2 } from "lucide-react";

interface User {
  id: string;
  userId: string;
  userName: string;
  email: string;
  department?: string;
  role?: string;
}

interface BulkAssignRequest {
  userIds: string[];
  shiftId: string;
  officeLocationId: string;
  effectiveDate: string;
  isTemporary: boolean;
  endDate?: string;
  reason?: string;
}

export default function BulkShiftAssignmentPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<ShiftResponse[]>([]);
  const [locations, setLocations] = useState<LocationResponse[]>([]);

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    shiftId: "",
    officeLocationId: "",
    effectiveDate: new Date().toISOString().split("T")[0],
    isTemporary: false,
    endDate: "",
    reason: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, shiftsData, locationsData] = await Promise.all([
        api.get<User[]>("/users/active"),
        shiftsApi.getActiveShifts(),
        locationsApi.getActiveLocations(),
      ]);

      setUsers(Array.isArray(usersData) ? usersData : []);
      setShifts(Array.isArray(shiftsData) ? shiftsData : []);
      setLocations(Array.isArray(locationsData) ? locationsData : []);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    const filteredUserIds = filteredUsers.map((u) => u.userId);
    if (selectedUsers.length === filteredUserIds.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUserIds);
    }
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    if (!formData.shiftId) {
      toast.error("Please select a shift");
      return;
    }

    if (!formData.officeLocationId) {
      toast.error("Please select an office location");
      return;
    }

    if (formData.isTemporary && !formData.endDate) {
      toast.error("Please provide an end date for temporary assignment");
      return;
    }

    const payload: BulkAssignRequest = {
      userIds: selectedUsers,
      shiftId: formData.shiftId,
      officeLocationId: formData.officeLocationId,
      effectiveDate: formData.effectiveDate,
      isTemporary: formData.isTemporary,
      endDate: formData.isTemporary ? formData.endDate : undefined,
      reason: formData.reason || undefined,
    };

    try {
      setSubmitting(true);
      await api.post("/bulk-operations/assign-shifts", payload);
      toast.success(`Shift assigned to ${selectedUsers.length} user(s) successfully!`);
      router.push("/admin/settings/shifts");
    } catch (error: any) {
      console.error("Failed to assign shifts:", error);
      toast.error(error.message || "Failed to assign shifts");
    } finally {
      setSubmitting(false);
    }
  };

  const departments = Array.from(new Set(users.map((u) => u.department).filter(Boolean)));

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.userId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment = !filterDepartment || user.department === filterDepartment;

    return matchesSearch && matchesDepartment;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const selectedShift = shifts.find((s) => s.id === formData.shiftId);
  const selectedLocation = locations.find((l) => l.id === formData.officeLocationId);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/admin/settings/shifts")}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Shift Assignment</h1>
          <p className="text-gray-600 mt-1">Assign shifts and office locations to multiple users</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: User Selection */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Select Users ({selectedUsers.length} selected)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or ID..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-600">
                Showing {filteredUsers.length} of {users.length} users
              </p>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {selectedUsers.length === filteredUsers.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            {/* User List */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No users found</div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {filteredUsers.map((user) => (
                    <label
                      key={user.userId}
                      className="flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.userId)}
                        onChange={() => handleToggleUser(user.userId)}
                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{user.userName}</p>
                        <p className="text-sm text-gray-600 truncate">{user.email}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500">{user.userId}</span>
                          {user.department && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              {user.department}
                            </span>
                          )}
                          {user.role && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                              {user.role}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Assignment Details */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Assignment Details</h2>

            {/* Shift Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shift <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.shiftId}
                onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Shift</option>
                {shifts.map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.name} ({shift.startTime} - {shift.endTime})
                  </option>
                ))}
              </select>
              {selectedShift && (
                <div className="mt-2 text-sm text-gray-600 bg-blue-50 rounded-lg p-3">
                  <p className="font-medium text-blue-900">{selectedShift.name}</p>
                  <p className="text-blue-800">
                    {selectedShift.startTime} - {selectedShift.endTime}
                  </p>
                  <p className="text-blue-700 text-xs mt-1">{selectedShift.type}</p>
                </div>
              )}
            </div>

            {/* Office Location Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Office Location <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.officeLocationId}
                onChange={(e) => setFormData({ ...formData, officeLocationId: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Location</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} {location.city ? `- ${location.city}` : ""}
                  </option>
                ))}
              </select>
              {selectedLocation && (
                <div className="mt-2 text-sm text-gray-600 bg-green-50 rounded-lg p-3">
                  <p className="font-medium text-green-900">{selectedLocation.name}</p>
                  {selectedLocation.city && (
                    <p className="text-green-800">{selectedLocation.city}</p>
                  )}
                  <p className="text-green-700 text-xs mt-1">{selectedLocation.code}</p>
                </div>
              )}
            </div>

            {/* Effective Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Effective From <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Temporary Assignment */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isTemporary}
                  onChange={(e) =>
                    setFormData({ ...formData, isTemporary: e.target.checked, endDate: "" })
                  }
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Temporary Assignment</span>
              </label>
            </div>

            {/* End Date (if temporary) */}
            {formData.isTemporary && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.effectiveDate}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (Optional)
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
                placeholder="E.g., New shift rotation, temporary coverage..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || selectedUsers.length === 0}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Users className="h-5 w-5" />
                  Assign to {selectedUsers.length} User{selectedUsers.length !== 1 ? "s" : ""}
                </>
              )}
            </button>

            {selectedUsers.length === 0 && (
              <p className="text-sm text-amber-600 text-center">
                ⚠ Please select at least one user
              </p>
            )}
          </div>

          {/* Summary Card */}
          {selectedUsers.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
              <h3 className="font-semibold text-blue-900 mb-3">Assignment Summary</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex justify-between">
                  <span>Users:</span>
                  <span className="font-bold">{selectedUsers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shift:</span>
                  <span className="font-bold">{selectedShift?.name || "Not selected"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Location:</span>
                  <span className="font-bold">{selectedLocation?.name || "Not selected"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-bold">
                    {formData.isTemporary ? "Temporary" : "Permanent"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
