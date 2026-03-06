import { api } from '../api-client';

export interface DailyDashboardResponse {
  date: string;
  totalEmployees: number;
  totalWorkingEmployees: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  onLeaveCount: number;
  halfDayCount: number;
  weekOffCount: number;
  holidayCount: number;
  presentPercentage: number;
  latePercentage: number;
  absentPercentage: number;
  notCheckedInCount: number;
  checkedInCount: number;
  checkedOutCount: number;
  onBreakCount: number;
  averageWorkHours: number;
  overtimeCount: number;
  totalOvertimeHours: number;
  recentActivities: RecentActivity[];
  departmentStats: { [key: string]: DepartmentStats };
}

export interface RecentActivity {
  userId: string;
  userName: string;
  activity: string;
  timestamp: string;
  location?: string;
}

export interface DepartmentStats {
  total: number;
  present: number;
  late: number;
  absent: number;
  onLeave: number;
  presentPercentage: number;
}

export interface MonthlyReportResponse {
  userId: string;
  userName: string;
  userEmail: string;
  department?: string;
  year: number;
  month: number;
  totalWorkingDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  halfDays: number;
  leaveDays: number;
  weekOffs: number;
  holidays: number;
  attendancePercentage: number;
  punctualityPercentage: number;
  totalWorkMinutes: number;
  averageWorkHoursPerDay: number;
  totalOvertimeMinutes: number;
  totalLateMinutes: number;
  totalBreakMinutes?: number;
  earlyCheckIns?: number;
  lateCheckIns?: number;
  earlyCheckOuts?: number;
  overtimeDays?: number;
  dailyAttendance: DayAttendance[];
  weeklyStats?: { [key: string]: number };
  leaveTypeBreakdown: { [key: string]: number };
  performanceRating: string;
  remarks: string[];
}

export interface DayAttendance {
  date: string;
  dayOfWeek: string;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  workMinutes?: number;
  lateMinutes?: number;
  overtimeMinutes?: number;
  isLocationVerified?: boolean;
  leaveType?: string;
}

export interface TeamAttendanceResponse {
  startDate: string;
  endDate: string;
  totalTeamMembers: number;
  teamMembers: TeamMemberAttendance[];
  teamAttendancePercentage: number;
  teamPresentCount: number;
  teamAbsentCount: number;
  teamOnLeaveCount: number;
}

export interface TeamMemberAttendance {
  userId: string;
  userName: string;
  userEmail: string;
  department?: string;
  position?: string;
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  attendancePercentage: number;
  averageWorkHours: number;
  totalLateMinutes: number;
  totalOvertimeMinutes: number;
  todayStatus?: string;
  todayCheckInTime?: string;
  todayCheckOutTime?: string;
  isTodayCheckedIn?: boolean;
}

/**
 * API client for attendance reports
 */
export const reportsApi = {
  /**
   * Get daily attendance dashboard
   */
  getDailyDashboard: (date?: string) =>
    api.get(`/attendance/admin/dashboard/daily${date ? `?date=${date}` : ''}`),

  /**
   * Get monthly report for a user (admin)
   */
  getMonthlyReport: (userId: string, year: number, month: number) =>
    api.get(`/attendance/admin/report/monthly/${userId}?year=${year}&month=${month}`),

  /**
   * Get my monthly report
   */
  getMyMonthlyReport: (year: number, month: number) =>
    api.get(`/attendance/my/report/monthly?year=${year}&month=${month}`),

  /**
   * Get team attendance (manager)
   */
  getTeamAttendance: (startDate: string, endDate: string) =>
    api.get(`/attendance/admin/team?startDate=${startDate}&endDate=${endDate}`)
};
