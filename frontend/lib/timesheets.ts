import { api } from './api-client';

export type TimeEntryType = 'BILLABLE' | 'NON_BILLABLE' | 'INTERNAL';

export interface TimeEntry {
  id: string;
  entryId: string;
  userId: string;
  taskId?: string;
  projectId?: string;
  description?: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  type?: TimeEntryType;
  isBillable?: boolean;
  createdAt?: string;
}

export interface WorkloadSummary {
  userId: string;
  userName: string;
  assignedTasks: number;
  completedTasks: number;
  totalHoursLogged: number;
  pendingHours: number;
}

export interface CreateTimeEntryRequest {
  taskId?: string;
  projectId?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  type?: TimeEntryType;
  isBillable?: boolean;
}

export const timesheetsService = {
  async createEntry(request: CreateTimeEntryRequest): Promise<TimeEntry> {
    return await api.post<TimeEntry>('/time-entries', request);
  },

  async getEntries(userId?: string, from?: string, to?: string): Promise<TimeEntry[]> {
    let url = '/time-entries';
    const params: string[] = [];
    if (userId) params.push(`userId=${userId}`);
    if (from) params.push(`from=${from}`);
    if (to) params.push(`to=${to}`);
    if (params.length) url += '?' + params.join('&');
    return await api.get<TimeEntry[]>(url);
  },

  async getWorkload(date?: string): Promise<WorkloadSummary[]> {
    const url = date ? `/time-entries/workload?date=${date}` : '/time-entries/workload';
    return await api.get<WorkloadSummary[]>(url);
  },

  async startTimer(taskId: string, projectId?: string): Promise<TimeEntry> {
    return await api.post<TimeEntry>('/time-entries/start', { taskId, projectId });
  },

  async stopTimer(entryId: string): Promise<TimeEntry> {
    return await api.post<TimeEntry>(`/time-entries/${entryId}/stop`, {});
  },
};
