"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { attendanceApi } from "@/lib/api/attendance";
import { CheckInButton } from "@/components/attendance/CheckInButton";
import { CheckOutButton } from "@/components/attendance/CheckOutButton";
import { AttendanceStatusBadge } from "@/components/attendance/AttendanceStatusBadge";
import AttendanceCalendar from "@/components/attendance/AttendanceCalendar";
import { usePermissionContext } from "@/providers/PermissionProvider";
import { toast } from "react-hot-toast";
import {
  CalendarClock,
  Users,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Coffee,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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

interface TeamAttendance {
  userId: string;
  userName: string;
  userEmail: string;
  department: string;
  attendanceId?: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: string;
  type?: string;
  totalWorkMinutes?: number;
  lateMinutes?: number;
  breaks?: any[];
  isLocationVerified?: boolean;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkInAddress?: string;
}

type TabType = "my-attendance" | "team-attendance";
type TeamViewType = "daily" | "weekly" | "monthly";

function getWeekRangeString(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d.setDate(diff));
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export default function AttendancePage() {
  const { hasPermission } = usePermissionContext();
  const [activeTab, setActiveTab] = useState<TabType>("my-attendance");
  const [teamView, setTeamView] = useState<TeamViewType>("daily");
  const [teamSummary, setTeamSummary] = useState<any>(null);
  const [summaryDate, setSummaryDate] = useState(new Date());
  const [expandedSummaryUserId, setExpandedSummaryUserId] = useState<string | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [teamAttendance, setTeamAttendance] = useState<TeamAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamLoading, setTeamLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  const isAdmin = hasPermission("ATTENDANCE", "VIEWALL");

  const loadTodayAttendance = async () => {
    try {
      const data = await attendanceApi.getMyToday();
      setTodayAttendance(data ?? null);
    } catch (error) {
      console.error("Failed to load attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamAttendance = async () => {
    try {
      setTeamLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const response = await attendanceApi.getDetailedDailyAttendance(today);

      // The new endpoint returns data directly in the format we need
      setTeamAttendance(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Failed to load team attendance:", error);
      toast.error("Failed to load team attendance");
      setTeamAttendance([]);
    } finally {
      setTeamLoading(false);
    }
  };

  const loadTeamSummary = async (type: TeamViewType, date: Date) => {
    try {
      setTeamLoading(true);
      
      let startDateStr, endDateStr;
      
      if (type === "weekly") {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const start = new Date(d.setDate(diff));
        
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        
        startDateStr = start.toISOString().split("T")[0];
        endDateStr = end.toISOString().split("T")[0];
      } else if (type === "monthly") {
        const year = date.getFullYear();
        const month = date.getMonth();
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0);
        
        startDateStr = start.toISOString().split("T")[0];
        endDateStr = end.toISOString().split("T")[0];
      } else {
        return;
      }
      
      const response = await attendanceApi.getAdminTeamSummary(startDateStr, endDateStr);
      setTeamSummary(response);
    } catch (error) {
      console.error(`Failed to load team ${type} summary:`, error);
      toast.error(`Failed to load team summary`);
      setTeamSummary(null);
    } finally {
      setTeamLoading(false);
    }
  };

  const loadMonthAttendance = async () => {
    try {
      setCalendarLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      const data = await attendanceApi.getMyHistory(startDateStr, endDateStr);

      if (Array.isArray(data)) {
        const records = data.map((record: any) => ({
          date: record.attendanceDate,
          status: record.status,
          checkInTime: record.checkInTime,
          checkOutTime: record.checkOutTime,
          workMinutes: record.totalWorkMinutes,
        }));
        setAttendanceRecords(records);
      }
    } catch (error) {
      console.error("Failed to load month attendance:", error);
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

  useEffect(() => {
    if (activeTab === "team-attendance" && isAdmin) {
      if (teamView === "daily") {
        loadTeamAttendance();
      } else {
        loadTeamSummary(teamView, summaryDate);
      }
    }
  }, [activeTab, isAdmin, teamView, summaryDate]);

  const formatTime = (dateTime?: string) => {
    if (!dateTime) return "-";
    return new Date(dateTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PRESENT":
      case "CHECKED_IN":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "ABSENT":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "ON_LEAVE":
        return <Coffee className="h-5 w-5 text-blue-600" />;
      case "LATE":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
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
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
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

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex gap-1">
        <button
          onClick={() => setActiveTab("my-attendance")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
            activeTab === "my-attendance"
              ? "bg-blue-600 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <User className="h-5 w-5" />
          My Attendance
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab("team-attendance")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "team-attendance"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Users className="h-5 w-5" />
            Team Attendance
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
              Admin
            </span>
          </button>
        )}
      </div>

      {/* Content */}
      {activeTab === "my-attendance" ? (
        <>
          {/* Main Action Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {!todayAttendance && (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-4xl">👋</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Good Morning!</h2>
                  <p className="text-gray-600 mt-2">
                    Ready to start your day? Check in to mark your attendance.
                  </p>
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
                  <p className="text-gray-600 mt-2">
                    Don't forget to check out when you're done for the day.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Check-in Time</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatTime(todayAttendance.checkInTime)}
                      </p>
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
                  <p className="text-gray-600 mt-2">
                    You've checked out for today. See you tomorrow!
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 space-y-4 max-w-md mx-auto">
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div>
                      <p className="text-sm text-gray-600">Check-in</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatTime(todayAttendance.checkInTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Check-out</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatTime(todayAttendance.checkOutTime)}
                      </p>
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
                  const record = attendanceRecords.find((r) => r.date === date);
                  if (record) {
                    toast.success(`${new Date(date).toLocaleDateString()}: ${record.status}`);
                  }
                }}
              />
            )}
          </div>
        </>
      ) : (
        /* Team Attendance View */
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold">Team Attendance</h2>
              <p className="text-blue-100 text-sm mt-1">
                Real-time attendance status and historical summaries
              </p>
            </div>
            <div className="flex bg-white/20 rounded-lg p-1">
              <button
                onClick={() => setTeamView("daily")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  teamView === "daily" ? "bg-white text-blue-700 shadow" : "text-white hover:bg-white/10" // eslint-disable-next-line react/jsx-no-bind
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setTeamView("weekly")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  teamView === "weekly" ? "bg-white text-blue-700 shadow" : "text-white hover:bg-white/10" // eslint-disable-next-line react/jsx-no-bind
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setTeamView("monthly")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  teamView === "monthly" ? "bg-white text-blue-700 shadow" : "text-white hover:bg-white/10" // eslint-disable-next-line react/jsx-no-bind
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {teamView !== "daily" && (
            <div className="px-6 py-3 border-b flex justify-between items-center bg-gray-50/80">
              <button
                onClick={() => {
                  const newDate = new Date(summaryDate);
                  if (teamView === "weekly") newDate.setDate(newDate.getDate() - 7);
                  else newDate.setMonth(newDate.getMonth() - 1);
                  setSummaryDate(newDate);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-semibold text-gray-800 tracking-wide text-sm">
                {teamView === "weekly" 
                  ? getWeekRangeString(summaryDate)
                  : summaryDate.toLocaleString("default", { month: "long", year: "numeric" })}
              </span>
              <button
                onClick={() => {
                  const newDate = new Date(summaryDate);
                  if (teamView === "weekly") newDate.setDate(newDate.getDate() + 7);
                  else newDate.setMonth(newDate.getMonth() + 1);
                  setSummaryDate(newDate);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-600"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {teamLoading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : teamView === "daily" ? (
            <>
              {teamAttendance.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>No team attendance records found for today</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Check In
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Check Out
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Work Hours
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Location
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {teamAttendance.map((record, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {record.userName || "Unknown"}
                              </div>
                              <div className="text-xs text-gray-500">{record.userEmail}</div>
                              {record.department && (
                                <div className="text-xs text-gray-400">{record.department}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(record.status)}
                              <AttendanceStatusBadge
                                status={record.status as any}
                                lateMinutes={record.lateMinutes}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatTime(record.checkInTime)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {record.checkOutTime ? (
                                formatTime(record.checkOutTime)
                              ) : (
                                <span className="inline-flex items-center gap-1 text-green-600">
                                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                  Active
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatDuration(record.totalWorkMinutes)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                record.type === "OFFICE"
                                  ? "bg-blue-100 text-blue-800"
                                  : record.type === "REMOTE"
                                    ? "bg-green-100 text-green-800"
                                    : record.type === "FIELD"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {record.type || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              {record.checkInLatitude && record.checkInLongitude ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1">
                                    {record.isLocationVerified ? (
                                      <span className="text-green-600 flex items-center gap-1 font-medium">
                                        <MapPin className="h-4 w-4" />
                                        Verified
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        Not verified
                                      </span>
                                    )}
                                  </div>
                                  {record.checkInAddress && (
                                    <div
                                      className="text-xs text-gray-600 max-w-xs truncate"
                                      title={record.checkInAddress}
                                    >
                                      {record.checkInAddress}
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-400 font-mono">
                                    {record.checkInLatitude.toFixed(6)},{" "}
                                    {record.checkInLongitude.toFixed(6)}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Summary Stats */}
              {teamAttendance.length > 0 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Total Employees</p>
                      <p className="text-lg font-bold text-gray-900">{teamAttendance.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Present</p>
                      <p className="text-lg font-bold text-green-600">
                        {
                          teamAttendance.filter(
                            (r) => r.status === "PRESENT" || r.status === "LATE" || r.checkInTime
                          ).length
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">On Leave</p>
                      <p className="text-lg font-bold text-blue-600">
                        {teamAttendance.filter((r) => r.status === "ON_LEAVE").length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Absent</p>
                      <p className="text-lg font-bold text-red-600">
                        {teamAttendance.filter((r) => r.status === "ABSENT").length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Late</p>
                      <p className="text-lg font-bold text-yellow-600">
                        {teamAttendance.filter((r) => r.status === "LATE").length}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Weekly/Monthly Summary View */
            !teamSummary || !teamSummary.teamMembers || teamSummary.teamMembers.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>No attendance records found for this period</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Presence
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Late
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Absent/Leave
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Avg Hours
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Performance
                      </th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {teamSummary.teamMembers.map((member: any, index: number) => (
                      <React.Fragment key={index}>
                      <tr 
                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${expandedSummaryUserId === member.userId ? 'bg-blue-50/50' : ''}`}
                        onClick={() => setExpandedSummaryUserId(expandedSummaryUserId === member.userId ? null : member.userId)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {member.userName || "Unknown"}
                            </div>
                            <div className="text-xs text-gray-500">{member.userEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {member.presentDays} / {member.totalDays} Days
                            </span>
                            <span className="text-xs text-green-600 font-medium">
                              {member.attendancePercentage}% Check-in Rate
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {member.lateDays > 0 ? (
                            <span className="inline-flex flex-col items-center">
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                {member.lateDays} Days
                              </span>
                              <span className="text-xs text-gray-500 mt-1">
                                {Math.floor((member.totalLateMinutes || 0) / 60)}h {(member.totalLateMinutes || 0) % 60}m Total
                              </span>
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                           <div className="flex flex-col items-center gap-1">
                             {member.absentDays > 0 && (
                               <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-800">
                                 {member.absentDays} Absent
                               </span>
                             )}
                             {member.leaveDays > 0 && (
                               <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                                 {member.leaveDays} Leave
                               </span>
                             )}
                             {member.absentDays === 0 && member.leaveDays === 0 && (
                               <span className="text-gray-400">-</span>
                             )}
                           </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {member.averageWorkHours ? member.averageWorkHours.toFixed(1) + " hrs" : "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-24 bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                            <div className={`h-2.5 rounded-full ${member.attendancePercentage >= 95 ? 'bg-green-500' : member.attendancePercentage >= 85 ? 'bg-blue-500' : member.attendancePercentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(member.attendancePercentage, 100)}%` }}></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {expandedSummaryUserId === member.userId ? (
                            <ChevronUp className="w-5 h-5 text-gray-500 mx-auto" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500 mx-auto" />
                          )}
                        </td>
                      </tr>
                      {expandedSummaryUserId === member.userId && (
                        <tr className="bg-gray-50/80 border-b border-gray-200">
                          <td colSpan={7} className="px-6 py-6 border-x-4 border-l-blue-500 border-r-transparent">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                              <h3 className="font-semibold text-gray-900 mb-4">{member.userName}'s Details</h3>
                              <AttendanceCalendar
                                year={summaryDate.getFullYear()}
                                month={summaryDate.getMonth()}
                                attendanceRecords={member.dailyRecords || []}
                                onDateClick={(date) => {
                                  const record = (member.dailyRecords || []).find((r: any) => r.date === date);
                                  if (record) {
                                    const timeStr = record.checkInTime ? ` (${record.checkInTime} - ${record.checkOutTime || 'Active'})` : '';
                                    toast.success(`${new Date(date).toLocaleDateString()}: ${record.status}${timeStr}`);
                                  } else {
                                    toast.error(`No record found for ${new Date(date).toLocaleDateString()}`);
                                  }
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
