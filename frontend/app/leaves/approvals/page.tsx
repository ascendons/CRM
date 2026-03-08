'use client';

import { useEffect, useState } from 'react';
import { leavesApi, LeaveResponse, ApproveLeaveRequest } from '@/lib/api/leaves';
import { LeaveStatusBadge } from '@/components/leaves/LeaveStatusBadge';
import { toast } from 'react-hot-toast';

export default function LeaveApprovalsPage() {
  const [pendingLeaves, setPendingLeaves] = useState<LeaveResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadPendingApprovals = async () => {
    try {
      const leaves = await leavesApi.getPendingApprovals();
      setPendingLeaves(leaves);
    } catch (error) {
      console.error('Failed to load pending approvals:', error);
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const handleApprove = async (leaveId: string) => {
    if (!confirm('Are you sure you want to approve this leave request?')) {
      return;
    }

    setProcessingId(leaveId);
    try {
      const request: ApproveLeaveRequest = {
        leaveId,
        approved: true
      };

      await leavesApi.approveLeave(request);
      toast.success('Leave approved successfully!');
      loadPendingApprovals();
    } catch (error: any) {
      console.error('Approval error:', error);
      toast.error(error.message || 'Failed to approve leave');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (leaveId: string) => {
    const reason = prompt('Please provide a reason for rejecting this leave:');
    if (!reason || reason.trim().length < 10) {
      toast.error('Rejection reason must be at least 10 characters');
      return;
    }

    setProcessingId(leaveId);
    try {
      const request: ApproveLeaveRequest = {
        leaveId,
        approved: false,
        rejectionReason: reason
      };

      await leavesApi.approveLeave(request);
      toast.success('Leave rejected');
      loadPendingApprovals();
    } catch (error: any) {
      console.error('Rejection error:', error);
      toast.error(error.message || 'Failed to reject leave');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLeaveTypeName = (type: string) => {
    const typeNames: { [key: string]: string } = {
      'SICK': 'Sick Leave',
      'CASUAL': 'Casual Leave',
      'EARNED': 'Earned Leave',
      'PAID': 'Paid Leave',
      'UNPAID': 'Unpaid Leave',
      'MATERNITY': 'Maternity Leave',
      'PATERNITY': 'Paternity Leave',
      'COMPENSATORY': 'Comp Off',
      'BEREAVEMENT': 'Bereavement Leave',
      'MARRIAGE': 'Marriage Leave'
    };
    return typeNames[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Leave Approvals</h1>
        <p className="text-gray-600 mt-1">
          Review and approve leave requests from your team members
        </p>
      </div>

      {/* Pending Count */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-blue-900 font-medium">
          {pendingLeaves.length} {pendingLeaves.length === 1 ? 'request' : 'requests'} pending approval
        </p>
      </div>

      {/* Leave Requests */}
      {pendingLeaves.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">There are no pending leave requests to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingLeaves.map((leave) => (
            <div key={leave.id} className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {leave.userName}
                  </h3>
                  <p className="text-sm text-gray-600">{leave.userEmail}</p>
                </div>
                <LeaveStatusBadge status={leave.status as any} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Leave Type</p>
                  <p className="text-sm font-medium text-gray-900">
                    {getLeaveTypeName(leave.leaveType)}
                    {leave.isHalfDay && (
                      <span className="ml-1 text-xs text-gray-500">(Half Day)</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Date Range</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Days</p>
                  <p className="text-sm font-medium text-gray-900">
                    {leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Business Days</p>
                  <p className="text-sm font-medium text-gray-900">{leave.businessDays}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Reason</p>
                <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">
                  {leave.reason}
                </p>
              </div>

              {leave.isEmergencyLeave && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-900">🚨 Emergency Leave</p>
                  {leave.emergencyContactNumber && (
                    <p className="text-sm text-red-800 mt-1">
                      Contact: {leave.emergencyContactNumber}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleApprove(leave.leaveId)}
                  disabled={processingId === leave.leaveId}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
                >
                  {processingId === leave.leaveId ? 'Processing...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleReject(leave.leaveId)}
                  disabled={processingId === leave.leaveId}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
                >
                  {processingId === leave.leaveId ? 'Processing...' : 'Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
