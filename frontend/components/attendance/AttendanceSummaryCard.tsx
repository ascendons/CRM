'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LogIn, CheckCircle2, LogOut, Clock, MapPin, ArrowUpRight } from 'lucide-react';
import { CheckInButton } from './CheckInButton';
import { CheckOutButton } from './CheckOutButton';
import { AttendanceStatusBadge } from './AttendanceStatusBadge';

interface AttendanceSummaryCardProps {
  todayAttendance: any;
  loading: boolean;
  onRefresh: () => void;
}

export function AttendanceSummaryCard({ todayAttendance, loading, onRefresh }: AttendanceSummaryCardProps) {
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

  const isOnLeave = todayAttendance?.status === 'ON_LEAVE';
  const isCheckedIn = todayAttendance && todayAttendance.checkInTime && !todayAttendance.checkOutTime && !isOnLeave;
  const isCheckedOut = todayAttendance && todayAttendance.checkOutTime && !isOnLeave;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-20 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
              isCheckedOut ? 'bg-purple-50 text-purple-600' :
              isCheckedIn ? 'bg-green-50 text-green-600' :
              'bg-blue-50 text-blue-600'
            }`}>
              {isCheckedOut ? <LogOut className="h-5 w-5" /> :
               isCheckedIn ? <CheckCircle2 className="h-5 w-5" /> :
               <LogIn className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Today's Attendance</h3>
              <p className="text-xs text-slate-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
          <Link
            href="/attendance"
            className="text-primary hover:text-primary-hover transition-colors flex items-center gap-1 text-sm font-semibold"
          >
            View All
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Status */}
        {isOnLeave ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 px-3 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">On Leave Today</span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">Leave Type</p>
              <p className="text-sm font-semibold text-slate-900">{todayAttendance.systemNotes || 'Approved Leave'}</p>
              {todayAttendance.leaveId && (
                <p className="text-xs text-slate-500 mt-1">ID: {todayAttendance.leaveId}</p>
              )}
            </div>
          </div>
        ) : !todayAttendance ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 px-3 bg-amber-50 border border-amber-100 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Not checked in yet</span>
              </div>
            </div>
            <CheckInButton onSuccess={onRefresh} />
          </div>
        ) : isCheckedIn ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Check-in</p>
                <p className="text-sm font-semibold text-slate-900">{formatTime(todayAttendance.checkInTime)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <AttendanceStatusBadge
                  status={todayAttendance.status}
                  lateMinutes={todayAttendance.lateMinutes}
                />
              </div>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-green-50 border border-green-100 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-sm font-medium">Currently checked in • {todayAttendance.type}</span>
              </div>
            </div>
            <CheckOutButton attendanceId={todayAttendance.attendanceId} onSuccess={onRefresh} />
          </div>
        ) : isCheckedOut ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">In</p>
                <p className="text-sm font-semibold text-slate-900">{formatTime(todayAttendance.checkInTime)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Out</p>
                <p className="text-sm font-semibold text-slate-900">{formatTime(todayAttendance.checkOutTime)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Total</p>
                <p className="text-sm font-semibold text-slate-900">{formatDuration(todayAttendance.totalWorkMinutes)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-purple-50 border border-purple-100 rounded-lg">
              <div className="flex items-center gap-2 text-purple-700">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Day complete</span>
              </div>
              {todayAttendance.overtimeMinutes > 0 && (
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                  +{formatDuration(todayAttendance.overtimeMinutes)} OT
                </span>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
