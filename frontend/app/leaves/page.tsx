'use client';

import { useEffect, useState } from 'react';
import { leavesApi, LeaveResponse, LeaveBalanceResponse, ApproveLeaveRequest } from '@/lib/api/leaves';
import { LeaveBalanceCard } from '@/components/leaves/LeaveBalanceCard';
import { LeaveStatusBadge } from '@/components/leaves/LeaveStatusBadge';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { usePermissionContext } from '@/providers/PermissionProvider';

type TabType = 'my-leaves' | 'team-leaves';
type ApprovalAction = 'approve' | 'reject' | null;

export default function LeavesPage() {
  const { hasPermission } = usePermissionContext();
  const [activeTab, setActiveTab] = useState<TabType>('my-leaves');
  const [leaves, setLeaves] = useState<LeaveResponse[]>([]);
  const [teamLeaves, setTeamLeaves] = useState<LeaveResponse[]>([]);
  const [balance, setBalance] = useState<LeaveBalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<ApprovalAction>(null);
  const [selectedLeave, setSelectedLeave] = useState<LeaveResponse | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Check if user is a manager (has permission to approve leaves)
  const isManager = hasPermission('LEAVE', 'APPROVE');

  // Debug logging
  console.log('🔍 Leaves Page Debug:', {
    isManager,
    hasPermissionFunction: typeof hasPermission,
    teamLeavesCount: teamLeaves.length
  });

  const loadData = async () => {
    try {
      const promises: Promise<any>[] = [
        leavesApi.getMyLeaves(),
        leavesApi.getMyBalance(selectedYear)
      ];

      // If manager, also load team leaves
      if (isManager) {
        promises.push(leavesApi.getTeamLeaves());
      }

      const results = await Promise.all(promises);

      setLeaves(results[0]);
      setBalance(results[1]);

      if (isManager && results[2]) {
        setTeamLeaves(results[2]);
      }
    } catch (error) {
      console.error('Failed to load leaves data:', error);
      toast.error('Failed to load leaves data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const handleApprove = (leave: LeaveResponse) => {
    // Verify leave is still pending
    if (leave.status !== 'PENDING') {
      toast.error('This leave is no longer pending. Refreshing data...');
      loadData();
      return;
    }
    setSelectedLeave(leave);
    setApprovalAction('approve');
    setShowApprovalModal(true);
  };

  const handleReject = (leave: LeaveResponse) => {
    // Verify leave is still pending
    if (leave.status !== 'PENDING') {
      toast.error('This leave is no longer pending. Refreshing data...');
      loadData();
      return;
    }
    setSelectedLeave(leave);
    setApprovalAction('reject');
    setRejectionReason('');
    setShowApprovalModal(true);
  };

  const handleConfirmApproval = async () => {
    if (!selectedLeave) return;

    if (approvalAction === 'reject' && rejectionReason.trim().length < 10) {
      toast.error('Rejection reason must be at least 10 characters');
      return;
    }

    setProcessingId(selectedLeave.leaveId);
    try {
      const request: ApproveLeaveRequest = {
        leaveId: selectedLeave.leaveId,
        approved: approvalAction === 'approve',
        ...(approvalAction === 'reject' && { rejectionReason: rejectionReason.trim() })
      };

      await leavesApi.approveLeave(request);

      // Optimistic update: immediately update the status in local state
      const newStatus = approvalAction === 'approve' ? 'APPROVED' : 'REJECTED';
      setTeamLeaves(prev => prev.map(leave =>
        leave.leaveId === selectedLeave.leaveId
          ? { ...leave, status: newStatus }
          : leave
      ));

      toast.success(approvalAction === 'approve' ? 'Leave approved successfully!' : 'Leave rejected');
      setShowApprovalModal(false);
      setSelectedLeave(null);
      setRejectionReason('');

      // Reload data in background to sync with backend
      loadData();
    } catch (error: any) {
      console.error('Approval error:', error);

      // Check if it's a "not in pending state" error
      if (error.message && error.message.includes('not in pending state')) {
        toast.error('This leave has already been processed. Refreshing data...');
        // Close modal and refresh to show correct status
        setShowApprovalModal(false);
        setSelectedLeave(null);
        setRejectionReason('');
        loadData();
      } else {
        toast.error(error.message || `Failed to ${approvalAction} leave`);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelApproval = () => {
    setShowApprovalModal(false);
    setSelectedLeave(null);
    setRejectionReason('');
    setApprovalAction(null);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Leaves</h1>
          <p className="text-gray-600 mt-1">Manage your leave requests and view your balance</p>
        </div>
        <Link
          href="/leaves/new"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          Apply for Leave
        </Link>
      </div>

      {/* Year Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Year:</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
          <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
          <option value={new Date().getFullYear() + 1}>{new Date().getFullYear() + 1}</option>
        </select>
      </div>

      {/* Leave Balance Cards */}
      {balance && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Leave Balance ({selectedYear})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(balance.balances).map(([type, typeBalance]) => (
              <LeaveBalanceCard
                key={type}
                leaveType={type}
                balance={typeBalance}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tabs (if manager) */}
      {isManager && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('my-leaves')}
              className={`${
                activeTab === 'my-leaves'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              My Leaves
            </button>
            <button
              onClick={() => setActiveTab('team-leaves')}
              className={`${
                activeTab === 'team-leaves'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Team Leaves
              {teamLeaves.length > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                  {teamLeaves.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      )}

      {/* Leave History */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {activeTab === 'my-leaves' ? 'My Leave History' : 'Team Leave History'}
        </h2>

        {((activeTab === 'my-leaves' ? leaves : teamLeaves).length === 0) ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Leaves Yet</h3>
            <p className="text-gray-600 mb-6">You haven't applied for any leaves yet.</p>
            <Link
              href="/leaves/new"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Apply for Leave
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leave ID
                    </th>
                    {activeTab === 'team-leaves' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Range
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(activeTab === 'my-leaves' ? leaves : teamLeaves).map((leave) => (
                    <tr key={leave.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {leave.leaveId}
                      </td>
                      {activeTab === 'team-leaves' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{leave.userName}</div>
                          <div className="text-xs text-gray-500">{leave.userEmail}</div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getLeaveTypeName(leave.leaveType)}
                        {leave.isHalfDay && (
                          <span className="ml-2 text-xs text-gray-500">(Half Day)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'}
                        <span className="text-gray-500 ml-1">({leave.businessDays} business)</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <LeaveStatusBadge status={leave.status as any} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {activeTab === 'team-leaves' && leave.status === 'PENDING' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(leave)}
                              disabled={processingId === leave.leaveId}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {processingId === leave.leaveId ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(leave)}
                              disabled={processingId === leave.leaveId}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Reject
                            </button>
                            <Link
                              href={`/leaves/${leave.leaveId}`}
                              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                            >
                              Details
                            </Link>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {activeTab === 'team-leaves' && (leave.status === 'APPROVED' || leave.status === 'REJECTED') && (
                              <span className={`px-3 py-1 text-xs font-medium rounded ${
                                leave.status === 'APPROVED'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {leave.status === 'APPROVED' ? '✓ Approved' : '✗ Rejected'}
                              </span>
                            )}
                            <Link
                              href={`/leaves/${leave.leaveId}`}
                              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                            >
                              View Details
                            </Link>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {approvalAction === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
              </h3>

              {/* Leave Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Employee:</span>
                  <span className="text-sm font-medium text-gray-900">{selectedLeave.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Leave Type:</span>
                  <span className="text-sm font-medium text-gray-900">{getLeaveTypeName(selectedLeave.leaveType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Duration:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(selectedLeave.startDate)} - {formatDate(selectedLeave.endDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Days:</span>
                  <span className="text-sm font-medium text-gray-900">{selectedLeave.businessDays} business days</span>
                </div>
                {selectedLeave.reason && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Reason:</span>
                    <p className="text-sm text-gray-900 mt-1">{selectedLeave.reason}</p>
                  </div>
                )}
              </div>

              {/* Rejection Reason Input */}
              {approvalAction === 'reject' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection (minimum 10 characters)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {rejectionReason.length}/10 characters minimum
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancelApproval}
                  disabled={!!processingId}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmApproval}
                  disabled={!!processingId || (approvalAction === 'reject' && rejectionReason.trim().length < 10)}
                  className={`px-4 py-2 font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                    approvalAction === 'approve'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {processingId ? 'Processing...' : approvalAction === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
