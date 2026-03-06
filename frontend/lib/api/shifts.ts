import api from '../api-client';

export interface CreateShiftRequest {
  name: string;
  description?: string;
  code: string;
  startTime: string; // "09:00"
  endTime: string; // "18:00"
  workHoursMinutes: number;
  type: 'FIXED' | 'FLEXIBLE' | 'ROTATIONAL';
  graceMinutes?: number;
  flexibleStartMinutes?: number;
  flexibleEndMinutes?: number;
  mandatoryBreakMinutes?: number;
  maxBreakMinutes?: number;
  workingDays?: string[];
  weekendDays?: string[];
  allowOvertime?: boolean;
  maxOvertimeMinutesPerDay?: number;
  minOvertimeMinutes?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface UpdateShiftRequest extends Partial<CreateShiftRequest> {}

export const shiftsApi = {
  // CRUD operations
  create: (data: CreateShiftRequest) =>
    api.post('/shifts', data),

  update: (id: string, data: UpdateShiftRequest) =>
    api.put(`/shifts/${id}`, data),

  delete: (id: string) =>
    api.delete(`/shifts/${id}`),

  getById: (id: string) =>
    api.get(`/shifts/${id}`),

  getAll: () =>
    api.get('/shifts'),

  getActive: () =>
    api.get('/shifts/active')
};
