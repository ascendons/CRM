"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { leavesApi, LeaveResponse } from "@/lib/api/leaves";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
} from "lucide-react";

export default function LeaveDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leaveId = params.id as string;

  const [leave, setLeave] = useState<LeaveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadLeaveDetails();
  }, [leaveId]);

  const loadLeaveDetails = async () => {
    try {
      setLoading(true);
      const leave = await leavesApi.getLeaveById(leaveId);
      setLeave(leave);
    } catch (error) {
      console.error("Failed to load leave:", error);
      toast.error("Failed to load leave details");
      router.push("/leaves");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelLeave = async () => {
    if (!leave) return;

    const reason = window.prompt("Please provide a reason for cancellation:");
    if (!reason || reason.trim() === "") {
      toast.error("Cancellation reason is required");
      return;
    }

    try {
      setCancelling(true);
      await leavesApi.cancelLeave({ leaveId, cancellationReason: reason.trim() });
      toast.success("Leave cancelled successfully");
      loadLeaveDetails();
    } catch (error: any) {
      console.error("Failed to cancel leave:", error);
      toast.error(error.message || "Failed to cancel leave");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: AlertCircle,
        label: "Pending",
      },
      APPROVED: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: CheckCircle,
        label: "Approved",
      },
      REJECTED: { bg: "bg-red-100", text: "text-red-800", icon: XCircle, label: "Rejected" },
      CANCELLED: { bg: "bg-gray-100", text: "text-gray-800", icon: XCircle, label: "Cancelled" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
      >
        <Icon className="h-4 w-4" />
        {config.label}
      </span>
    );
  };

  const getLeaveTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SICK: "Sick Leave",
      CASUAL: "Casual Leave",
      EARNED: "Earned Leave",
      PAID: "Paid Leave",
      UNPAID: "Unpaid Leave",
      MATERNITY: "Maternity Leave",
      PATERNITY: "Paternity Leave",
      COMPENSATORY: "Compensatory Leave",
      BEREAVEMENT: "Bereavement Leave",
      MARRIAGE: "Marriage Leave",
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!leave) {
    return null;
  }

  const canCancel = leave.status === "PENDING" && !leave.isCancelled;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/leaves")}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leave Details</h1>
            <p className="text-gray-600 mt-1">ID: {leave.leaveId}</p>
          </div>
        </div>
        {getStatusBadge(leave.status)}
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Leave Type Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold">{getLeaveTypeLabel(leave.leaveType)}</h2>
              <p className="text-blue-100 mt-1">
                {leave.isHalfDay
                  ? `Half Day (${leave.halfDayType})`
                  : `${leave.totalDays} day${leave.totalDays !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6 space-y-6">
          {/* Dates Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Leave Duration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-600 mb-1">Start Date</p>
                <p className="text-lg font-semibold text-slate-900">
                  {formatDate(leave.startDate)}
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-600 mb-1">End Date</p>
                <p className="text-lg font-semibold text-slate-900">{formatDate(leave.endDate)}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-sm text-blue-600 mb-1">Total Days</p>
                <p className="text-3xl font-bold text-blue-900">{leave.totalDays}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-sm text-green-600 mb-1">Business Days</p>
                <p className="text-3xl font-bold text-green-900">{leave.businessDays}</p>
              </div>
            </div>
          </div>

          {/* Reason Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Reason
            </h3>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-slate-700 whitespace-pre-wrap">{leave.reason}</p>
            </div>
          </div>

          {/* Emergency Leave Info */}
          {leave.isEmergencyLeave && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-orange-800 font-semibold mb-2">
                <AlertCircle className="h-5 w-5" />
                Emergency Leave
              </div>
              {leave.emergencyContactNumber && (
                <p className="text-sm text-orange-700">
                  Emergency Contact: {leave.emergencyContactNumber}
                </p>
              )}
            </div>
          )}

          {/* Leave Balance Impact */}
          {leave.balanceBefore !== undefined && leave.balanceAfter !== undefined && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Balance Impact</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-slate-600 mb-1">Before</p>
                  <p className="text-2xl font-bold text-slate-900">{leave.balanceBefore}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-red-600 mb-1">Deducted</p>
                  <p className="text-2xl font-bold text-red-900">-{leave.businessDays}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-green-600 mb-1">After</p>
                  <p className="text-2xl font-bold text-green-900">{leave.balanceAfter}</p>
                </div>
              </div>
            </div>
          )}

          {/* Approval Section */}
          {leave.status === "APPROVED" && leave.approverName && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Approval Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Approved By:</span>
                  <span className="font-semibold text-green-900">{leave.approverName}</span>
                </div>
                {leave.approvedAt && (
                  <div className="flex justify-between">
                    <span className="text-green-700">Approved At:</span>
                    <span className="font-semibold text-green-900">
                      {formatDateTime(leave.approvedAt)}
                    </span>
                  </div>
                )}
                {leave.approvalNotes && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-green-700 mb-1">Notes:</p>
                    <p className="text-green-900">{leave.approvalNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rejection Section */}
          {leave.status === "REJECTED" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Rejection Details
              </h3>
              <div className="space-y-2 text-sm">
                {leave.approverName && (
                  <div className="flex justify-between">
                    <span className="text-red-700">Rejected By:</span>
                    <span className="font-semibold text-red-900">{leave.approverName}</span>
                  </div>
                )}
                {leave.approvedAt && (
                  <div className="flex justify-between">
                    <span className="text-red-700">Rejected At:</span>
                    <span className="font-semibold text-red-900">
                      {formatDateTime(leave.approvedAt)}
                    </span>
                  </div>
                )}
                {leave.rejectionReason && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-red-700 mb-1">Reason:</p>
                    <p className="text-red-900">{leave.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cancellation Section */}
          {leave.isCancelled && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Cancellation Details
              </h3>
              <div className="space-y-2 text-sm">
                {leave.cancelledAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Cancelled At:</span>
                    <span className="font-semibold text-gray-900">
                      {formatDateTime(leave.cancelledAt)}
                    </span>
                  </div>
                )}
                {leave.cancellationReason && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-gray-700 mb-1">Reason:</p>
                    <p className="text-gray-900">{leave.cancellationReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Applied: {formatDateTime(leave.createdAt)}</span>
              </div>
              {leave.lastModifiedAt && leave.lastModifiedAt !== leave.createdAt && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Last Updated: {formatDateTime(leave.lastModifiedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {canCancel && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
          <button
            onClick={handleCancelLeave}
            disabled={cancelling}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {cancelling ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5" />
                Cancel Leave Request
              </>
            )}
          </button>
          <p className="text-sm text-slate-600 mt-2">
            You can cancel this leave request until it is approved or rejected.
          </p>
        </div>
      )}
    </div>
  );
}
