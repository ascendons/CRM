'use client';

import { useEffect, useState } from 'react';
import { leavesApi, LeaveResponse, LeaveBalanceResponse } from '@/lib/api/leaves';
import { LeaveBalanceCard } from '@/components/leaves/LeaveBalanceCard';
import { LeaveStatusBadge } from '@/components/leaves/LeaveStatusBadge';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<LeaveResponse[]>([]);
  const [balance, setBalance] = useState<LeaveBalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadData = async () => {
    try {
      const [leavesResponse, balanceResponse] = await Promise.all([
        leavesApi.getMyLeaves(),
        leavesApi.getMyBalance(selectedYear)
      ]);

      if (leavesResponse.success) {
        setLeaves(leavesResponse.data);
      }

      if (balanceResponse.success) {
        setBalance(balanceResponse.data);
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

      {/* Leave History */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Leave History</h2>

        {leaves.length === 0 ? (
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
                  {leaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {leave.leaveId}
                      </td>
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
                        <Link
                          href={`/leaves/${leave.leaveId}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
