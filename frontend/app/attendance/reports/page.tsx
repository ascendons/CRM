'use client';

import { useEffect, useState } from 'react';
import { reportsApi, MonthlyReportResponse } from '@/lib/api/reports';
import { AttendanceStatusBadge } from '@/components/attendance/AttendanceStatusBadge';
import { BarChart, PieChart, ProgressRing } from '@/components/attendance/AttendanceCharts';
import { toast } from 'react-hot-toast';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { exportToExcel, exportToPDF, formatAttendanceForExport, formatMonthlyReportForExport } from '@/lib/utils/exportUtils';

export default function AttendanceReportsPage() {
  const [report, setReport] = useState<MonthlyReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await reportsApi.getMyMonthlyReport(year, month);
      setReport(data);
    } catch (error) {
      console.error('Failed to load report:', error);
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [year, month]);

  const handleExportExcel = () => {
    if (!report) return;

    if (report.dailyAttendance && report.dailyAttendance.length > 0) {
      const { headers, rows } = formatAttendanceForExport(report.dailyAttendance);
      exportToExcel({
        headers,
        rows,
        filename: `Attendance_${year}_${String(month).padStart(2, '0')}`
      });
      toast.success('Exported to Excel successfully!');
    } else {
      toast.error('No data to export');
    }
  };

  const handleExportPDF = () => {
    if (!report) return;

    if (report.dailyAttendance && report.dailyAttendance.length > 0) {
      const { headers, rows } = formatAttendanceForExport(report.dailyAttendance);
      exportToPDF({
        headers,
        rows,
        filename: `Attendance_${year}_${String(month).padStart(2, '0')}`,
        title: `Attendance Report - ${month}/${year}`
      });
      toast.success('Opening print dialog...');
    } else {
      toast.error('No data to export');
    }
  };

  const handleExportSummary = () => {
    if (!report) return;

    const { headers, rows } = formatMonthlyReportForExport(report);
    exportToExcel({
      headers,
      rows,
      filename: `Attendance_Summary_${year}_${String(month).padStart(2, '0')}`
    });
    toast.success('Summary exported successfully!');
  };

  const formatTime = (time?: string) => {
    if (!time) return '-';
    return time;
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'EXCELLENT': return 'text-green-600';
      case 'GOOD': return 'text-blue-600';
      case 'AVERAGE': return 'text-yellow-600';
      default: return 'text-red-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return <div className="p-6">No data available</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monthly Attendance Report</h1>
          <p className="text-gray-600 mt-1">Detailed analysis of your attendance and performance</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {[year - 1, year, year + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
              title="Export to Excel"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
              title="Export to PDF"
            >
              <FileText className="h-4 w-4" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Attendance Rate</p>
          <p className="text-3xl font-bold text-green-600 mb-1">
            {report.attendancePercentage.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500">
            {report.presentDays} of {report.totalWorkingDays} days
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Punctuality Rate</p>
          <p className="text-3xl font-bold text-blue-600 mb-1">
            {report.punctualityPercentage.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500">
            {report.presentDays - report.lateDays} on-time days
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Avg Work Hours</p>
          <p className="text-3xl font-bold text-purple-600 mb-1">
            {report.averageWorkHoursPerDay.toFixed(1)}h
          </p>
          <p className="text-xs text-gray-500">
            {(report.totalWorkMinutes / 60).toFixed(0)} total hours
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Performance</p>
          <p className={`text-2xl font-bold ${getRatingColor(report.performanceRating)}`}>
            {report.performanceRating.replace('_', ' ')}
          </p>
          <p className="text-xs text-gray-500 mt-2">Overall rating</p>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Status Pie Chart */}
        <PieChart
          title="Attendance Distribution"
          data={[
            { label: 'Present', value: report.presentDays, color: '#10b981' },
            { label: 'Late', value: report.lateDays, color: '#f59e0b' },
            { label: 'Absent', value: report.absentDays, color: '#ef4444' },
            { label: 'On Leave', value: report.leaveDays, color: '#8b5cf6' },
            { label: 'Half Day', value: report.halfDays, color: '#3b82f6' }
          ].filter(item => item.value > 0)}
        />

        {/* Work Hours Bar Chart */}
        <BarChart
          title="Time Analysis"
          data={[
            {
              label: 'Work Hours',
              value: Math.floor(report.totalWorkMinutes / 60),
              color: '#3b82f6'
            },
            {
              label: 'Overtime',
              value: Math.floor(report.totalOvertimeMinutes / 60),
              color: '#10b981'
            },
            {
              label: 'Late (min)',
              value: report.totalLateMinutes,
              color: '#f59e0b'
            }
          ]}
          height={250}
        />
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Performance Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <ProgressRing
            value={report.presentDays}
            max={report.totalWorkingDays}
            label="Attendance"
            color="#10b981"
          />
          <ProgressRing
            value={Math.floor(report.totalWorkMinutes / 60)}
            max={report.totalWorkingDays * 8}
            label="Work Hours"
            color="#3b82f6"
          />
          <ProgressRing
            value={report.totalWorkingDays - report.lateDays}
            max={report.totalWorkingDays}
            label="On Time"
            color="#8b5cf6"
          />
          <ProgressRing
            value={Math.floor(report.totalOvertimeMinutes / 60)}
            max={Math.floor(report.totalWorkMinutes / 60)}
            label="Overtime"
            color="#f59e0b"
          />
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Status Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Present Days</p>
            <p className="text-2xl font-bold text-green-600">{report.presentDays}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Late Days</p>
            <p className="text-2xl font-bold text-yellow-600">{report.lateDays}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Absent Days</p>
            <p className="text-2xl font-bold text-red-600">{report.absentDays}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Leave Days</p>
            <p className="text-2xl font-bold text-blue-600">{report.leaveDays}</p>
          </div>
        </div>

        {/* Time Statistics */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Total Late Minutes</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.floor(report.totalLateMinutes / 60)}h {report.totalLateMinutes % 60}m
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Overtime</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.floor(report.totalOvertimeMinutes / 60)}h {report.totalOvertimeMinutes % 60}m
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Half Days</p>
              <p className="text-xl font-bold text-gray-900">{report.halfDays}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Breakdown */}
      {Object.keys(report.leaveTypeBreakdown).length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Leave Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(report.leaveTypeBreakdown).map(([type, days]) => (
              <div key={type} className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">{type.replace('_', ' ')}</p>
                <p className="text-2xl font-bold text-gray-900">{days}</p>
                <p className="text-xs text-gray-500">days</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remarks */}
      {report.remarks && report.remarks.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Performance Insights</h3>
          <ul className="space-y-2">
            {report.remarks.map((remark, index) => (
              <li key={index} className="text-sm text-blue-800 flex items-start">
                <span className="mr-2">•</span>
                {remark}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Daily Attendance Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Daily Attendance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Late</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overtime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {report.dailyAttendance.map((day) => (
                <tr key={day.date} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {day.dayOfWeek.substring(0, 3)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <AttendanceStatusBadge status={day.status as any} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTime(day.checkInTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTime(day.checkOutTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {day.workMinutes ? `${Math.floor(day.workMinutes / 60)}h ${day.workMinutes % 60}m` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                    {day.lateMinutes ? `${day.lateMinutes}m` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600">
                    {day.overtimeMinutes ? `${day.overtimeMinutes}m` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
