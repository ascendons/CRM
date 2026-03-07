'use client';

import { useState, useEffect } from 'react';
import { attendanceApi } from '@/lib/api/attendance';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AttendanceStatusBadge } from './AttendanceStatusBadge';

interface AttendanceCalendarProps {
  userId?: string;
  onDateClick?: (date: Date, attendance: any) => void;
}

export function AttendanceCalendar({ userId, onDateClick }: AttendanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendance, setAttendance] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    loadAttendance();
  }, [year, month, userId]);

  const loadAttendance = async () => {
    try {
      setLoading(true);

      // Get first and last day of month
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];

      const data = await attendanceApi.getMyHistory(startDate, endDate);

      // Create map of date -> attendance record
      const attendanceMap = new Map();
      if (Array.isArray(data)) {
        data.forEach((record: any) => {
          const dateKey = record.attendanceDate;
          attendanceMap.set(dateKey, record);
        });
      }

      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Failed to load attendance:', error);
      setAttendance(new Map());
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'PRESENT': 'bg-emerald-100 text-emerald-700 border-emerald-300',
      'LATE': 'bg-amber-100 text-amber-700 border-amber-300',
      'HALF_DAY': 'bg-blue-100 text-blue-700 border-blue-300',
      'ABSENT': 'bg-red-100 text-red-700 border-red-300',
      'ON_LEAVE': 'bg-purple-100 text-purple-700 border-purple-300',
      'HOLIDAY': 'bg-slate-100 text-slate-700 border-slate-300',
      'WEEK_OFF': 'bg-slate-50 text-slate-500 border-slate-200',
      'PENDING': 'bg-yellow-100 text-yellow-700 border-yellow-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      'PRESENT': '✓',
      'LATE': '⚠',
      'HALF_DAY': '½',
      'ABSENT': '✗',
      'ON_LEAVE': '🏖',
      'HOLIDAY': '🎉',
      'WEEK_OFF': '🏠',
      'PENDING': '⏳'
    };
    return icons[status] || '•';
  };

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
  };

  const today = new Date();
  const days = getDaysInMonth();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>

          <h2 className="text-xl font-bold text-white">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>

          <button
            onClick={nextMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-slate-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {loading ? (
            <div className="col-span-7 flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const date = new Date(year, month, day);
              const dateKey = date.toISOString().split('T')[0];
              const record = attendance.get(dateKey);

              const isToday =
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear();

              const isFuture = date > today;

              return (
                <button
                  key={day}
                  onClick={() => onDateClick?.(date, record)}
                  disabled={!record && !isToday}
                  className={`
                    aspect-square p-2 rounded-lg border-2 transition-all
                    ${record ? getStatusColor(record.status) : 'bg-white border-slate-200'}
                    ${isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                    ${isFuture ? 'opacity-40' : ''}
                    ${record || isToday ? 'hover:scale-105 hover:shadow-md cursor-pointer' : 'cursor-default'}
                    disabled:cursor-default disabled:hover:scale-100 disabled:hover:shadow-none
                  `}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className={`text-sm font-semibold ${isToday ? 'text-blue-600' : ''}`}>
                      {day}
                    </span>
                    {record && (
                      <span className="text-lg mt-1">
                        {getStatusIcon(record.status)}
                      </span>
                    )}
                    {record && record.lateMinutes > 0 && (
                      <span className="text-[10px] font-medium mt-0.5">
                        -{record.lateMinutes}m
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-600 mb-3">Legend:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { status: 'PRESENT', label: 'Present' },
              { status: 'LATE', label: 'Late' },
              { status: 'ON_LEAVE', label: 'On Leave' },
              { status: 'ABSENT', label: 'Absent' },
              { status: 'HOLIDAY', label: 'Holiday' },
              { status: 'WEEK_OFF', label: 'Week Off' },
              { status: 'HALF_DAY', label: 'Half Day' },
              { status: 'PENDING', label: 'Pending' }
            ].map(({ status, label }) => (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded border-2 ${getStatusColor(status)}`}>
                  <span className="text-[10px] flex items-center justify-center">
                    {getStatusIcon(status)}
                  </span>
                </div>
                <span className="text-xs text-slate-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
