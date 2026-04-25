"use client";

import { useState, useEffect } from "react";
import { CreateLeaveRequest, leavesApi, LeaveBalanceResponse } from "@/lib/api/leaves";
import { holidaysApi, HolidayResponse } from "@/lib/api/holidays";
import { toast } from "react-hot-toast";
import { Calendar, AlertCircle, Info } from "lucide-react";

interface LeaveRequestFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LeaveRequestForm({ onSuccess, onCancel }: LeaveRequestFormProps) {
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<LeaveBalanceResponse | null>(null);
  const [holidays, setHolidays] = useState<HolidayResponse[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [formData, setFormData] = useState<CreateLeaveRequest>({
    leaveType: "CASUAL",
    startDate: "",
    endDate: "",
    reason: "",
    isHalfDay: false,
  });

  const leaveTypes = [
    { value: "SICK", label: "Sick Leave", color: "text-red-600" },
    { value: "CASUAL", label: "Casual Leave", color: "text-blue-600" },
    { value: "EARNED", label: "Earned Leave", color: "text-green-600" },
    { value: "PAID", label: "Paid Leave", color: "text-purple-600" },
    { value: "COMPENSATORY", label: "Comp Off", color: "text-orange-600" },
    { value: "MARRIAGE", label: "Marriage Leave", color: "text-pink-600" },
    { value: "BEREAVEMENT", label: "Bereavement Leave", color: "text-gray-600" },
  ];

  const getLeaveTypeName = (type: string) => {
    const names: Record<string, string> = {
      SICK: "Sick",
      CASUAL: "Casual",
      EARNED: "Earned",
      PAID: "Paid",
      UNPAID: "Unpaid",
      MATERNITY: "Maternity",
      PATERNITY: "Paternity",
      COMPENSATORY: "Comp Off",
      BEREAVEMENT: "Bereavement",
      MARRIAGE: "Marriage",
    };
    return names[type] || type;
  };

  useEffect(() => {
    loadBalanceAndHolidays();
  }, []);

  const loadBalanceAndHolidays = async () => {
    try {
      setLoadingBalance(true);
      const [balanceData, holidaysData] = await Promise.all([
        leavesApi.getMyBalance(),
        holidaysApi.getAllHolidays().catch(() => []),
      ]);
      setBalance(balanceData);
      setHolidays(holidaysData || []);
    } catch (error) {
      console.error("Failed to load balance/holidays:", error);
    } finally {
      setLoadingBalance(false);
    }
  };

  const getBalanceForType = (type: string) => {
    if (!balance?.balances) return null;
    return balance.balances[type];
  };

  const getHolidaysInRange = (start: string, end: string) => {
    if (!start || !end) return [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    return holidays.filter((h) => {
      const holidayDate = new Date(h.date);
      return holidayDate >= startDate && holidayDate <= endDate;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate no holidays in range
    const holidaysInRange = getHolidaysInRange(formData.startDate, formData.endDate);
    const mandatoryHolidays = holidaysInRange.filter((h) => !h.isOptional);

    if (mandatoryHolidays.length > 0 && !confirm(`Note: ${mandatoryHolidays.length} mandatory holiday(s) fall within your selected dates. Continue anyway?`)) {
      return;
    }

    setLoading(true);
    try {
      await leavesApi.applyLeave(formData);
      toast.success("Leave request submitted successfully!");
      onSuccess?.();
    } catch (error: any) {
      console.error("Leave request error:", error);
      toast.error(error.message || "Failed to submit leave request");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateLeaveRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const currentBalance = getBalanceForType(formData.leaveType);
  const holidaysInRange = getHolidaysInRange(formData.startDate, formData.endDate);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Leave Balance Info Banner */}
      {currentBalance && (
        <div className={`rounded-lg p-4 ${currentBalance.available > 0 ? "bg-blue-50 border border-blue-200" : "bg-red-50 border border-red-200"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className={`h-5 w-5 ${currentBalance.available > 0 ? "text-blue-600" : "text-red-600"}`} />
              <span className={`font-semibold ${currentBalance.available > 0 ? "text-blue-900" : "text-red-900"}`}>
                {currentBalance.available} {getLeaveTypeName(formData.leaveType)} Available
              </span>
            </div>
            <div className="text-sm text-blue-700">
              Used: {currentBalance.used} | Pending: {currentBalance.pending}
            </div>
          </div>
        </div>
      )}

      {/* Leave Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2"> Leave Type *</label>
        <select
          value={formData.leaveType}
          onChange={(e) => handleChange("leaveType", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          {leaveTypes.map((type) => {
            const typeBalance = getBalanceForType(type.value);
            return (
              <option key={type.value} value={type.value}>
                {type.label} {typeBalance ? `(${typeBalance.available} available)` : ""}
              </option>
            );
          })}
        </select>
      </div>

      {/* Half Day Option */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isHalfDay"
          checked={formData.isHalfDay || false}
          onChange={(e) => {
            handleChange("isHalfDay", e.target.checked);
            if (e.target.checked) {
              handleChange("endDate", formData.startDate);
            }
          }}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="isHalfDay" className="ml-2 text-sm text-gray-700">
          This is a half-day leave
        </label>
      </div>

      {/* Half Day Type */}
      {formData.isHalfDay && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Half Day Type *</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="halfDayType"
                value="FIRST_HALF"
                checked={formData.halfDayType === "FIRST_HALF"}
                onChange={(e) => handleChange("halfDayType", e.target.value)}
                className="w-4 h-4 text-blue-600"
                required
              />
              <span className="ml-2 text-sm text-gray-700">First Half (Morning)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="halfDayType"
                value="SECOND_HALF"
                checked={formData.halfDayType === "SECOND_HALF"}
                onChange={(e) => handleChange("halfDayType", e.target.value)}
                className="w-4 h-4 text-blue-600"
                required
              />
              <span className="ml-2 text-sm text-gray-700">Second Half (Afternoon)</span>
            </label>
          </div>
        </div>
      )}

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => {
              handleChange("startDate", e.target.value);
              if (formData.isHalfDay) {
                handleChange("endDate", e.target.value);
              }
            }}
            min={new Date().toISOString().split("T")[0]}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => handleChange("endDate", e.target.value)}
            min={formData.startDate || new Date().toISOString().split("T")[0]}
            disabled={formData.isHalfDay}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            required
          />
        </div>
      </div>

      {/* Holidays in Range Warning */}
      {holidaysInRange.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">
                {holidaysInRange.length} holiday{holidaysInRange.length > 1 ? "s" : ""} in selected range:
              </p>
              <ul className="mt-1 text-sm text-amber-800 space-y-1">
                {holidaysInRange.map((h) => (
                  <li key={h.id}>
                    • {h.name} ({new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })})
                    {h.isOptional && <span className="text-amber-600 ml-1">(Optional)</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Holidays Mini Calendar */}
      {holidays.length > 0 && !formData.startDate && (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming Holidays This Year
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {holidays.slice(0, 6).map((h) => (
              <div key={h.id} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${h.isOptional ? "bg-amber-400" : "bg-green-400"}`}></span>
                <span className="text-slate-600">{h.name}</span>
                <span className="text-slate-400 ml-auto">{new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
        <textarea
          value={formData.reason}
          onChange={(e) => handleChange("reason", e.target.value)}
          rows={4}
          minLength={10}
          maxLength={1000}
          placeholder="Please provide a reason for your leave request (minimum 10 characters)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
        <p className="text-sm text-gray-500 mt-1">{formData.reason.length}/1000 characters</p>
      </div>

      {/* Emergency Leave Option */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isEmergencyLeave"
          checked={formData.isEmergencyLeave || false}
          onChange={(e) => handleChange("isEmergencyLeave", e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="isEmergencyLeave" className="ml-2 text-sm text-gray-700">
          This is an emergency leave
        </label>
      </div>

      {/* Emergency Contact */}
      {formData.isEmergencyLeave && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Emergency Contact Number
          </label>
          <input
            type="tel"
            value={formData.emergencyContactNumber || ""}
            onChange={(e) => handleChange("emergencyContactNumber", e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Contact During Leave */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contact Number During Leave (Optional)
        </label>
        <input
          type="tel"
          value={formData.contactNumberDuringLeave || ""}
          onChange={(e) => handleChange("contactNumberDuringLeave", e.target.value)}
          placeholder="+91 98765 43210"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading || (currentBalance?.available ?? 0) <= 0}
          className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? "Submitting..." : "Submit Leave Request"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
