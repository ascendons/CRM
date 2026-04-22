"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { shiftsApi, CreateShiftRequest } from "@/lib/api/shifts";
import { toast } from "react-hot-toast";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

const SHIFT_TYPES = ["FIXED", "FLEXIBLE", "ROTATIONAL"] as const;
const DAYS_OF_WEEK = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export default function NewShiftPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateShiftRequest>({
    name: "",
    code: "",
    description: "",
    startTime: "09:00",
    endTime: "18:00",
    workHoursMinutes: 540, // 9 hours
    type: "FIXED",
    graceMinutes: 15,
    flexibleStartMinutes: 0,
    flexibleEndMinutes: 0,
    mandatoryBreakMinutes: 60,
    maxBreakMinutes: 90,
    workingDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    weekendDays: ["SATURDAY", "SUNDAY"],
    allowOvertime: true,
    maxOvertimeMinutesPerDay: 180,
    minOvertimeMinutes: 30,
    isDefault: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      await shiftsApi.createShift(formData);
      toast.success("Shift created successfully!");
      router.push("/admin/settings/shifts");
    } catch (error: any) {
      console.error("Failed to create shift:", error);
      toast.error(error.message || "Failed to create shift");
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkingDay = (day: string) => {
    setFormData((prev) => {
      const currentDays = prev.workingDays || [];
      return {
        ...prev,
        workingDays: currentDays.includes(day)
          ? currentDays.filter((d) => d !== day)
          : [...currentDays, day],
      };
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/settings/shifts"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shifts
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Create New Shift</h1>
          <p className="text-slate-600 mt-1">Define a new work shift schedule</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Shift Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Morning Shift"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Shift Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., MS1"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe this shift..."
                />
              </div>
            </div>
          </div>

          {/* Timing */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Timing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Start Time *
                </label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">End Time *</label>
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as CreateShiftRequest["type"] })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {SHIFT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Grace Period (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.graceMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, graceMinutes: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mandatory Break (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.mandatoryBreakMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, mandatoryBreakMinutes: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Max Break (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxBreakMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, maxBreakMinutes: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Working Days */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Working Days</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleWorkingDay(day)}
                  className={`px-4 py-3 rounded-lg font-semibold text-sm transition-colors ${
                    formData.workingDays?.includes(day)
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {day.substring(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Overtime Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Overtime Settings</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allowOvertime}
                  onChange={(e) => setFormData({ ...formData, allowOvertime: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">Allow Overtime</span>
              </label>
            </div>
            {formData.allowOvertime && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Max Overtime Per Day (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxOvertimeMinutesPerDay}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxOvertimeMinutesPerDay: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Min Overtime to Count (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minOvertimeMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, minOvertimeMinutes: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Default Settings</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-700">Default Shift</span>
                  <p className="text-xs text-slate-500">Automatically assigned to new employees</p>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Create Shift
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
