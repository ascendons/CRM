'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { attendanceApi } from '@/lib/api/attendance';
import { CheckInButton } from '@/components/attendance/CheckInButton';
import { CheckOutButton } from '@/components/attendance/CheckOutButton';
import { AttendanceStatusBadge } from '@/components/attendance/AttendanceStatusBadge';
import AttendanceCalendar from '@/components/attendance/AttendanceCalendar';
import { toast } from 'react-hot-toast';
import { CalendarClock, ArrowLeft } from 'lucide-react';

interface Attendance {
  id: string;
  attendanceId: string;
  attendanceDate: string;
  checkInTime: string;
  checkOutTime?: string;
  status: string;
  type: string;
  totalWorkMinutes?: number;
  lateMinutes?: number;
  isLocationVerified: boolean;
  locationValidationMessage?: string;
}

export default function AttendancePage() {
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  const loadTodayAttendance = async () => {
    try {
      const response = await attendanceApi.getMyToday();
      if (response.success) {
        setTodayAttendance(response.data);
      }
    } catch (error) {
      console.error('Failed to load attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthAttendance = async () => {
    try {
      setCalendarLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // 0-indexed to 1-indexed

      // Get first and last day of month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const data = await attendanceApi.getMyHistory(startDateStr, endDateStr);

      if (Array.isArray(data)) {
        // Transform to calendar format
        const records = data.map((record: any) => ({
          date: record.attendanceDate,
          status: record.status,
          checkInTime: record.checkInTime,
          checkOutTime: record.checkOutTime,
          workMinutes: record.totalWorkMinutes
        }));
        setAttendanceRecords(records);
      }
    } catch (error) {
      console.error('Failed to load month attendance:', error);
      setAttendanceRecords([]);
    } finally {
      setCalendarLoading(false);
    }
  };

  useEffect(() => {
    loadTodayAttendance();
    loadMonthAttendance();
  }, []);

  useEffect(() => {
    loadMonthAttendance();
  }, [currentDate]);

  const formatTime = (dateTime?: string) => {
    if (!dateTime) return '-';
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isCheckedIn = todayAttendance && !todayAttendance.checkOutTime;
  const isCheckedOut = todayAttendance && todayAttendance.checkOutTime;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-gray-600 mt-1">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <Link
          href="/attendance/daily"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5"
        >
          <CalendarClock className="h-5 w-5" />
          <span>Daily View</span>
        </Link>
      </div>

      {/* Main Action Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {!todayAttendance && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl">👋</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Good Morning!</h2>
              <p className="text-gray-600 mt-2">Ready to start your day? Check in to mark your attendance.</p>
            </div>
            <div className="max-w-md mx-auto">
              <CheckInButton onSuccess={loadTodayAttendance} />
            </div>
          </div>
        )}

        {isCheckedIn && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-4xl">✅</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mt-4">You're Checked In!</h2>
              <p className="text-gray-600 mt-2">Don't forget to check out when you're done for the day.</p>
            </div>

            {/* Current Session Info */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Check-in Time</p>
                  <p className="text-lg font-semibold text-gray-900">{formatTime(todayAttendance.checkInTime)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="text-lg font-semibold text-gray-900">{todayAttendance.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-1">
                    <AttendanceStatusBadge
                      status={todayAttendance.status as any}
                      lateMinutes={todayAttendance.lateMinutes}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location Verified</p>
                  <p className="text-lg font-semibold">
                    {todayAttendance.isLocationVerified ? (
                      <span className="text-green-600">✓ Yes</span>
                    ) : (
                      <span className="text-yellow-600">⚠ No</span>
                    )}
                  </p>
                </div>
              </div>

              {todayAttendance.locationValidationMessage && (
                <div className="text-sm text-gray-600 bg-white rounded-lg p-3">
                  {todayAttendance.locationValidationMessage}
                </div>
              )}
            </div>

            <div className="max-w-md mx-auto">
              <CheckOutButton
                attendanceId={todayAttendance.attendanceId}
                onSuccess={loadTodayAttendance}
              />
            </div>
          </div>
        )}

        {isCheckedOut && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl">🎉</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Day Complete!</h2>
              <p className="text-gray-600 mt-2">You've checked out for today. See you tomorrow!</p>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-4 max-w-md mx-auto">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm text-gray-600">Check-in</p>
                  <p className="text-lg font-semibold text-gray-900">{formatTime(todayAttendance.checkInTime)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Check-out</p>
                  <p className="text-lg font-semibold text-gray-900">{formatTime(todayAttendance.checkOutTime)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Work</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDuration(todayAttendance.totalWorkMinutes)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-1">
                    <AttendanceStatusBadge
                      status={todayAttendance.status as any}
                      lateMinutes={todayAttendance.lateMinutes}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-600">This Month</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">22 days</p>
          <p className="text-sm text-green-600 mt-1">95% attendance</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-600">Late Days</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">2 days</p>
          <p className="text-sm text-gray-600 mt-1">This month</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-600">Avg Work Hours</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">8.5 hrs</p>
          <p className="text-sm text-gray-600 mt-1">Per day</p>
        </div>
      </div>

      {/* Attendance Calendar */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Monthly Calendar</h2>
        {calendarLoading ? (
          <div className="bg-white rounded-xl shadow p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <AttendanceCalendar
            year={currentDate.getFullYear()}
            month={currentDate.getMonth()}
            attendanceRecords={attendanceRecords}
            onDateClick={(date) => {
              const record = attendanceRecords.find(r => r.date === date);
              if (record) {
                toast.success(`${new Date(date).toLocaleDateString()}: ${record.status}`);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
