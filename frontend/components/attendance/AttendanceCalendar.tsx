'use client';

import { useState } from 'react';

interface AttendanceRecord {
  date: string;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  workMinutes?: number;
}

interface AttendanceCalendarProps {
  year: number;
  month: number;
  attendanceRecords: AttendanceRecord[];
  onDateClick?: (date: string) => void;
}

export default function AttendanceCalendar({
  year,
  month,
  attendanceRecords,
  onDateClick
}: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState({ year, month });

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      PRESENT: { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-800' },
      LATE: { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-800' },
      ABSENT: { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-800' },
      HALF_DAY: { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-800' },
      ON_LEAVE: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800' },
      HOLIDAY: { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-800' },
      WEEK_OFF: { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-600' }
    };
    return colors[status] || { bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-400' };
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      PRESENT: '✓',
      LATE: '⏰',
      ABSENT: '✗',
      HALF_DAY: '½',
      ON_LEAVE: '🏖️',
      HOLIDAY: '🎉',
      WEEK_OFF: '🏠'
    };
    return icons[status] || '';
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const daysInMonth = getDaysInMonth(currentMonth.year, currentMonth.month);
  const firstDay = getFirstDayOfMonth(currentMonth.year, currentMonth.month);
  const monthName = new Date(currentMonth.year, currentMonth.month).toLocaleDateString('en-US', { month: 'long' });

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const getAttendanceForDate = (day: number) => {
    const dateStr = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return attendanceRecords.find(record => record.date.startsWith(dateStr));
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => prev.month === 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => prev.month === 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 });
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() });
  };

  const today = new Date();
  const isToday = (day: number) => {
    return day === today.getDate() && currentMonth.month === today.getMonth() && currentMonth.year === today.getFullYear();
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{monthName} {currentMonth.year}</h2>
        <div className="flex gap-2">
          <button onClick={goToPreviousMonth} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button onClick={goToToday} className="px-4 py-2 border border-gray-300 font-medium rounded-lg hover:bg-gray-50">
            Today
          </button>
          <button onClick={goToNextMonth} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, index) => {
          if (day === null) return <div key={`empty-${index}`} className="aspect-square" />;

          const attendance = getAttendanceForDate(day);
          const colors = attendance ? getStatusColor(attendance.status) : { bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-700' };
          const icon = attendance ? getStatusIcon(attendance.status) : '';

          return (
            <button
              key={day}
              onClick={() => onDateClick && onDateClick(`${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
              className={`aspect-square border-2 rounded-lg p-2 hover:shadow-md ${colors.bg} ${colors.border} ${isToday(day) ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="flex flex-col h-full">
                <div className={`text-sm font-semibold ${colors.text}`}>{day}</div>
                {icon && <div className="text-lg">{icon}</div>}
                {attendance?.workMinutes && <div className="text-xs text-gray-600 mt-auto">{formatDuration(attendance.workMinutes)}</div>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { status: 'PRESENT', label: 'Present' },
            { status: 'LATE', label: 'Late' },
            { status: 'ABSENT', label: 'Absent' },
            { status: 'ON_LEAVE', label: 'On Leave' }
          ].map(({ status, label }) => {
            const colors = getStatusColor(status);
            return (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-8 h-8 border-2 rounded ${colors.bg} ${colors.border} flex items-center justify-center`}>
                  {getStatusIcon(status)}
                </div>
                <span className="text-sm text-gray-700">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
