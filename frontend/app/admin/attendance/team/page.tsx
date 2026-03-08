'use client';

import { useEffect, useState } from 'react';
import { reportsApi, TeamAttendanceResponse } from '@/lib/api/reports';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function TeamAttendancePage() {
  const [teamData, setTeamData] = useState<TeamAttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(1)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const loadTeamAttendance = async () => {
    setLoading(true);
    try {
      const data = await reportsApi.getTeamAttendance(startDate, endDate);
      setTeamData(data);
    } catch (error) {
      console.error('Failed to load team attendance:', error);
      toast.error('Failed to load team attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamAttendance();
  }, [startDate, endDate]);

  const getStatusColor = (percentage: number) => {
    if (percentage >= 95) return 'text-green-600';
    if (percentage >= 85) return 'text-blue-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!teamData) {
    return <div className="p-6">No team data available</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Team Attendance</h1>
        <p className="text-gray-600 mt-1">Monitor and analyze your team's attendance performance</p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={loadTeamAttendance}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Team Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Total Team Members</p>
          <p className="text-3xl font-bold text-gray-900">{teamData.totalTeamMembers}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Team Attendance</p>
          <p className="text-3xl font-bold text-green-600">
            {teamData.teamAttendancePercentage.toFixed(1)}%
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Present Today</p>
          <p className="text-3xl font-bold text-green-600">{teamData.teamPresentCount}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Absent Today</p>
          <p className="text-3xl font-bold text-red-600">{teamData.teamAbsentCount}</p>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Today Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Attendance %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Present Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Late Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Absent Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Leave Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Avg Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {teamData.teamMembers.map((member) => (
                <tr key={member.userId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.userName}</p>
                      <p className="text-xs text-gray-500">{member.userEmail}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {member.todayStatus ? (
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.todayStatus === 'PRESENT' || member.todayStatus === 'LATE'
                            ? 'bg-green-100 text-green-800'
                            : member.todayStatus === 'ABSENT'
                            ? 'bg-red-100 text-red-800'
                            : member.todayStatus === 'ON_LEAVE'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {member.todayStatus}
                        </span>
                        {member.isTodayCheckedIn && (
                          <p className="text-xs text-gray-500 mt-1">
                            In: {member.todayCheckInTime}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className={`text-lg font-bold ${getStatusColor(member.attendancePercentage)}`}>
                      {member.attendancePercentage.toFixed(1)}%
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.presentDays}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                    {member.lateDays}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    {member.absentDays}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                    {member.leaveDays}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.averageWorkHours.toFixed(1)}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/admin/attendance/report/${member.userId}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Report
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Excellent (≥95%)</h3>
          <p className="text-4xl font-bold text-green-600">
            {teamData.teamMembers.filter(m => m.attendancePercentage >= 95).length}
          </p>
          <p className="text-sm text-gray-500 mt-2">team members</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Good (85-95%)</h3>
          <p className="text-4xl font-bold text-blue-600">
            {teamData.teamMembers.filter(m => m.attendancePercentage >= 85 && m.attendancePercentage < 95).length}
          </p>
          <p className="text-sm text-gray-500 mt-2">team members</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Needs Improvement (&lt;85%)</h3>
          <p className="text-4xl font-bold text-red-600">
            {teamData.teamMembers.filter(m => m.attendancePercentage < 85).length}
          </p>
          <p className="text-sm text-gray-500 mt-2">team members</p>
        </div>
      </div>
    </div>
  );
}
