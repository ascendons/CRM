'use client';

import { useEffect, useState } from 'react';
import { reportsApi, DailyDashboardResponse } from '@/lib/api/reports';
import { toast } from 'react-hot-toast';

export default function AttendanceDashboardPage() {
  const [dashboard, setDashboard] = useState<DailyDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const loadDashboard = async () => {
    try {
      const response = await reportsApi.getDailyDashboard(selectedDate);
      if (response.success) {
        setDashboard(response.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // Auto-refresh every 2 minutes
    const interval = setInterval(loadDashboard, 120000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!dashboard) {
    return <div className="p-6">No data available</div>;
  }

  const StatusCard = ({ label, value, percentage, color }: any) => (
    <div className="bg-white rounded-xl shadow p-6">
      <p className="text-sm text-gray-600 mb-2">{label}</p>
      <p className={`text-3xl font-bold text-${color}-600 mb-1`}>{value}</p>
      {percentage !== undefined && (
        <p className="text-sm text-gray-500">{percentage.toFixed(1)}%</p>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time attendance monitoring and analytics</p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={loadDashboard}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-sm opacity-90 mb-2">Total Employees</p>
          <p className="text-4xl font-bold">{dashboard.totalEmployees}</p>
          <p className="text-sm opacity-75 mt-1">
            Working: {dashboard.totalWorkingEmployees}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-sm opacity-90 mb-2">Present Today</p>
          <p className="text-4xl font-bold">{dashboard.presentCount + dashboard.lateCount}</p>
          <p className="text-sm opacity-75 mt-1">
            {dashboard.presentPercentage.toFixed(1)}% attendance
          </p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-sm opacity-90 mb-2">Late Arrivals</p>
          <p className="text-4xl font-bold">{dashboard.lateCount}</p>
          <p className="text-sm opacity-75 mt-1">
            {dashboard.latePercentage.toFixed(1)}% of workforce
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-sm opacity-90 mb-2">Absent</p>
          <p className="text-4xl font-bold">{dashboard.absentCount}</p>
          <p className="text-sm opacity-75 mt-1">
            {dashboard.absentPercentage.toFixed(1)}% of workforce
          </p>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Status Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatusCard label="On Time" value={dashboard.presentCount} color="green" />
          <StatusCard label="Late" value={dashboard.lateCount} color="yellow" />
          <StatusCard label="Absent" value={dashboard.absentCount} color="red" />
          <StatusCard label="On Leave" value={dashboard.onLeaveCount} color="blue" />
          <StatusCard label="Half Day" value={dashboard.halfDayCount} color="orange" />
          <StatusCard label="Not Checked In" value={dashboard.notCheckedInCount} color="gray" />
        </div>
      </div>

      {/* Check-in Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Checked In</h3>
            <span className="text-2xl">🟢</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{dashboard.checkedInCount}</p>
          <p className="text-sm text-gray-600 mt-1">Currently at work</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Checked Out</h3>
            <span className="text-2xl">🔵</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">{dashboard.checkedOutCount}</p>
          <p className="text-sm text-gray-600 mt-1">Completed for the day</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">On Break</h3>
            <span className="text-2xl">☕</span>
          </div>
          <p className="text-3xl font-bold text-orange-600">{dashboard.onBreakCount}</p>
          <p className="text-sm text-gray-600 mt-1">Taking a break</p>
        </div>
      </div>

      {/* Work Hours & Overtime */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Hours</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Average Work Hours</p>
              <p className="text-3xl font-bold text-gray-900">
                {dashboard.averageWorkHours.toFixed(1)}h
              </p>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Total Overtime Hours</p>
              <p className="text-2xl font-bold text-purple-600">
                {dashboard.totalOvertimeHours.toFixed(1)}h
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {dashboard.overtimeCount} employees with overtime
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {dashboard.recentActivities.length > 0 ? (
              dashboard.recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.userName}</p>
                    <p className="text-xs text-gray-500">{activity.activity.replace('_', ' ')}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No recent activities</p>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Attendance Overview</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Present (On Time)</span>
              <span className="font-medium text-green-600">{dashboard.presentCount} / {dashboard.totalWorkingEmployees}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(dashboard.presentCount / dashboard.totalWorkingEmployees) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Late Arrivals</span>
              <span className="font-medium text-yellow-600">{dashboard.lateCount} / {dashboard.totalWorkingEmployees}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-yellow-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(dashboard.lateCount / dashboard.totalWorkingEmployees) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Absent</span>
              <span className="font-medium text-red-600">{dashboard.absentCount} / {dashboard.totalWorkingEmployees}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-red-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(dashboard.absentCount / dashboard.totalWorkingEmployees) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">On Leave</span>
              <span className="font-medium text-blue-600">{dashboard.onLeaveCount} / {dashboard.totalWorkingEmployees}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(dashboard.onLeaveCount / dashboard.totalWorkingEmployees) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
