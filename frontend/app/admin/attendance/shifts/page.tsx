"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { shiftsApi, ShiftResponse } from "@/lib/api/shifts";
import { showToast } from "@/lib/toast";
import { EmptyState } from "@/components/EmptyState";
import ConfirmModal from "@/components/ConfirmModal";

export default function ShiftsPage() {
  const router = useRouter();
  const [shifts, setShifts] = useState<ShiftResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    try {
      setLoading(true);
      const data = await shiftsApi.getAllShifts();
      setShifts(data);
    } catch (err) {
      showToast.error("Failed to load shifts");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setShiftToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!shiftToDelete) return;

    try {
      setIsDeleting(true);
      await shiftsApi.deleteShift(shiftToDelete);
      showToast.success("Shift deleted successfully");
      setShowDeleteModal(false);
      loadShifts();
    } catch (err) {
      showToast.error("Failed to delete shift");
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return "-";
    // time is in HH:mm:ss format, convert to HH:mm AM/PM
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatMinutesToHours = (minutes?: number) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className="bg-slate-50 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shifts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shift Management</h1>
            <p className="mt-2 text-gray-600">
              Configure work shifts and schedules for your organization
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/admin/attendance/shifts/assign")}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined">person_add</span>
              Assign Users
            </button>
            <button
              onClick={() => router.push("/admin/attendance/shifts/new")}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              New Shift
            </button>
          </div>
        </div>

        {/* Table or Empty State */}
        {shifts.length === 0 ? (
          <EmptyState
            icon="schedule"
            title="No shifts configured"
            description="Get started by creating your first work shift"
            action={{
              label: "Create shift",
              onClick: () => router.push("/admin/attendance/shifts/new"),
            }}
          />
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shift Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Work Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shifts.map((shift) => (
                    <tr key={shift.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900">
                              {shift.name}
                            </div>
                            {shift.isDefault && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                Default
                              </span>
                            )}
                          </div>
                          {shift.code && (
                            <div className="text-xs text-gray-400 mt-1">
                              Code: {shift.code}
                            </div>
                          )}
                          {shift.description && (
                            <div className="text-sm text-gray-500 mt-1">
                              {shift.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                        </div>
                        {shift.graceMinutes && shift.graceMinutes > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Grace: {shift.graceMinutes} min
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          shift.type === "FIXED" ? "bg-gray-100 text-gray-800" :
                          shift.type === "FLEXIBLE" ? "bg-green-100 text-green-800" :
                          "bg-purple-100 text-purple-800"
                        }`}>
                          {shift.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatMinutesToHours(shift.workHoursMinutes)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          shift.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}>
                          {shift.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => router.push(`/admin/attendance/shifts/${shift.id}`)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          title="View details"
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>
                        <button
                          onClick={() => router.push(`/admin/attendance/shifts/${shift.id}/edit`)}
                          className="text-gray-600 hover:text-gray-900 mr-4"
                          title="Edit shift"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(shift.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete shift"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Total shifts: {shifts.length}
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Shift"
          message="Are you sure you want to delete this shift? This action cannot be undone. Users assigned to this shift may need to be reassigned."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          confirmButtonClass="bg-red-500 hover:bg-red-600"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteModal(false)}
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
}
