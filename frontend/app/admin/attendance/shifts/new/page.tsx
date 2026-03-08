"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { shiftsApi, CreateShiftRequest } from "@/lib/api/shifts";
import { showToast } from "@/lib/toast";

const DAYS_OF_WEEK = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
  { value: "SATURDAY", label: "Saturday" },
  { value: "SUNDAY", label: "Sunday" },
];

export default function NewShiftPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateShiftRequest>({
    name: "",
    description: "",
    code: "",
    startTime: "09:00",
    endTime: "18:00",
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

  // Calculate work hours in minutes from start and end time
  const calculateWorkHours = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;

    // If end time is earlier than start time, it means shift crosses midnight
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60; // Add 24 hours
    }

    return endMinutes - startMinutes;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      showToast.error("Shift name is required");
      return;
    }

    if (!formData.startTime || !formData.endTime) {
      showToast.error("Start time and end time are required");
      return;
    }

    // Calculate work hours
    const workHoursMinutes = calculateWorkHours(formData.startTime, formData.endTime);

    try {
      setLoading(true);
      await shiftsApi.createShift({
        ...formData,
        workHoursMinutes,
      });
      showToast.success("Shift created successfully");
      router.push("/admin/attendance/shifts");
    } catch (err: any) {
      showToast.error(err.message || "Failed to create shift");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day: string, field: "workingDays" | "weekendDays") => {
    const currentDays = formData[field] || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];

    setFormData({ ...formData, [field]: newDays });
  };

  return (
    <div className="bg-slate-50 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Shift</h1>
          <p className="mt-2 text-gray-600">Configure a new work shift for your organization</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shift Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Morning Shift, Night Shift"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shift Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., MS, NS"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shift Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="FIXED">Fixed</option>
                  <option value="FLEXIBLE">Flexible</option>
                  <option value="ROTATIONAL">Rotational</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe this shift..."
                />
              </div>
            </div>
          </div>

          {/* Timing */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shift Timing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grace Period (minutes)
                </label>
                <input
                  type="number"
                  value={formData.graceMinutes || ""}
                  onChange={(e) => setFormData({ ...formData, graceMinutes: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="15"
                  min="0"
                />
              </div>
            </div>

            {/* Calculated Work Hours Display */}
            {formData.startTime && formData.endTime && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-blue-600">schedule</span>
                  <span className="font-medium text-gray-700">Total Work Hours:</span>
                  <span className="text-blue-700 font-semibold">
                    {(() => {
                      const totalMinutes = calculateWorkHours(formData.startTime, formData.endTime);
                      const hours = Math.floor(totalMinutes / 60);
                      const mins = totalMinutes % 60;
                      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
                    })()}
                  </span>
                  <span className="text-gray-500 text-xs">({calculateWorkHours(formData.startTime, formData.endTime)} minutes)</span>
                </div>
              </div>
            )}
          </div>

          {/* Flexibility (only show if type is FLEXIBLE) */}
          {formData.type === "FLEXIBLE" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Flexibility Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Flexible Start Window (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.flexibleStartMinutes || ""}
                    onChange={(e) => setFormData({ ...formData, flexibleStartMinutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="60"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Flexible End Window (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.flexibleEndMinutes || ""}
                    onChange={(e) => setFormData({ ...formData, flexibleEndMinutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="60"
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Break Configuration */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Break Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mandatory Break (minutes)
                </label>
                <input
                  type="number"
                  value={formData.mandatoryBreakMinutes || ""}
                  onChange={(e) => setFormData({ ...formData, mandatoryBreakMinutes: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="60"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Break (minutes)
                </label>
                <input
                  type="number"
                  value={formData.maxBreakMinutes || ""}
                  onChange={(e) => setFormData({ ...formData, maxBreakMinutes: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="90"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Working Days */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Working Days</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DAYS_OF_WEEK.map((day) => (
                <label
                  key={day.value}
                  className={`flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.workingDays?.includes(day.value)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.workingDays?.includes(day.value)}
                    onChange={() => handleDayToggle(day.value, "workingDays")}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">{day.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Overtime */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Overtime Settings</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.allowOvertime}
                  onChange={(e) => setFormData({ ...formData, allowOvertime: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium">Allow Overtime</span>
              </label>

              {formData.allowOvertime && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Overtime Per Day (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.maxOvertimeMinutesPerDay || ""}
                      onChange={(e) => setFormData({ ...formData, maxOvertimeMinutesPerDay: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="180"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Overtime (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.minOvertimeMinutes || ""}
                      onChange={(e) => setFormData({ ...formData, minOvertimeMinutes: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="30"
                      min="0"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Options */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Options</h2>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium">Set as Default Shift</span>
              <span className="text-xs text-gray-500">(New users will be assigned to this shift by default)</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
            >
              {loading ? "Creating..." : "Create Shift"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
