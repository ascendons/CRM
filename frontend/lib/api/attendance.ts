import { api } from '../api-client';

export interface CheckInRequest {
  type: 'OFFICE' | 'REMOTE' | 'FIELD' | 'HYBRID' | 'CLIENT_SITE';
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  deviceInfo?: string;
  userNotes?: string;
  officeLocationId?: string;
}

export interface CheckOutRequest {
  attendanceId?: string; // Optional - backend uses userId + date instead
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  deviceInfo?: string;
  userNotes?: string;
}

export interface BreakStartRequest {
  attendanceId: string;
  type: 'LUNCH' | 'TEA' | 'PERSONAL' | 'PRAYER' | 'SMOKING' | 'MEETING';
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export interface BreakEndRequest {
  attendanceId: string;
  breakId: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export const attendanceApi = {
  // Check-in/out
  checkIn: (data: CheckInRequest) =>
    api.post('/attendance/check-in', data),

  checkOut: (data: CheckOutRequest) =>
    api.post('/attendance/check-out', data),

  // Break management
  startBreak: (data: BreakStartRequest) =>
    api.post('/attendance/break/start', data),

  endBreak: (data: BreakEndRequest) =>
    api.post('/attendance/break/end', data),

  // My attendance
  getMyToday: <T = any>() =>
    api.get<T>('/attendance/my/today'),

  getMyHistory: (startDate: string, endDate: string) =>
    api.get(`/attendance/my/history?startDate=${startDate}&endDate=${endDate}`),

  getMySummary: (year: number, month: number) =>
    api.get(`/attendance/my/summary?year=${year}&month=${month}`),

  getAttendanceById: <T = any>(attendanceId: string) =>
    api.get<T>(`/attendance/${attendanceId}`),

  // Admin APIs
  getDailyDashboard: <T = any>(date?: string) =>
    api.get<T>(`/attendance/admin/dashboard/daily${date ? '?date=' + date : ''}`),

  getMonthlyReport: (userId: string, year: number, month: number) =>
    api.get(`/attendance/admin/report/monthly/${userId}?year=${year}&month=${month}`),

  getTeamAttendance: (startDate: string, endDate: string) =>
    api.get(`/attendance/admin/team?startDate=${startDate}&endDate=${endDate}`)
};
