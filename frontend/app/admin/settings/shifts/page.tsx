"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { shiftsApi } from "@/lib/api/shifts";
import { toast } from "react-hot-toast";
import { Plus, Clock, Edit, Trash2, Users, Calendar, CheckCircle2, XCircle } from "lucide-react";

export default function ShiftsPage() {
  const router = useRouter();
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    try {
      setLoading(true);
      const data = await shiftsApi.getAllShifts();
      setShifts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load shifts:", error);
      toast.error("Failed to load shifts");
      setShifts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (shiftId: string) => {
    if (!confirm("Are you sure you want to delete this shift?")) {
      return;
    }

    try {
      setDeleteLoading(shiftId);
      await shiftsApi.deleteShift(shiftId);
      toast.success("Shift deleted successfully");
      loadShifts();
    } catch (error: any) {
      console.error("Failed to delete shift:", error);
      toast.error(error.message || "Failed to delete shift");
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return "-";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ""}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Shift Management</h1>
            <p className="text-slate-600 mt-1">Configure work shifts and schedules</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/settings/shifts/bulk-assign"
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg transition-colors"
            >
              <Users className="h-5 w-5" />
              Bulk Assign
            </Link>
            <Link
              href="/admin/settings/shifts/new"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Shift
            </Link>
          </div>
        </div>

        {/* Shifts Grid */}
        {shifts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <Clock className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Shifts Created</h3>
            <p className="text-slate-600 mb-6">
              Get started by creating your first shift schedule.
            </p>
            <Link
              href="/admin/settings/shifts/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Your First Shift
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shifts.map((shift) => (
              <div
                key={shift.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-slate-900">{shift.name}</h3>
                        {shift.isDefault && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                            Default
                          </span>
                        )}
                      </div>
                      {shift.code && <p className="text-sm text-slate-500">{shift.code}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      {shift.isActive ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {shift.description && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{shift.description}</p>
                  )}

                  {/* Timing */}
                  <div className="bg-slate-50 rounded-xl p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Start Time</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatTime(shift.startTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">End Time</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatTime(shift.endTime)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">Work Hours</p>
                        <p className="text-sm font-semibold text-blue-600">
                          {formatDuration(shift.workHoursMinutes)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <p className="text-xs text-blue-600 font-medium">Grace</p>
                      </div>
                      <p className="text-sm font-bold text-blue-900">{shift.graceMinutes} min</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <p className="text-xs text-purple-600 font-medium">Type</p>
                      </div>
                      <p className="text-sm font-bold text-purple-900">{shift.type}</p>
                    </div>
                  </div>

                  {/* Working Days */}
                  {shift.workingDays && shift.workingDays.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 mb-2">Working Days</p>
                      <div className="flex flex-wrap gap-1">
                        {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
                          <span
                            key={day}
                            className={`px-2 py-1 text-xs font-semibold rounded ${
                              shift.workingDays.includes(day.toUpperCase())
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-slate-200">
                    <Link
                      href={`/admin/settings/shifts/${shift.shiftId}`}
                      className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(shift.shiftId)}
                      disabled={deleteLoading === shift.shiftId}
                      className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {deleteLoading === shift.shiftId ? (
                        <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
