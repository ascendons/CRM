import { api } from "../api-client";

export interface ShiftResponse {
  id: string;
  shiftId: string;
  name: string;
  description?: string;
  code?: string;
  startTime: string;
  endTime: string;
  workHoursMinutes: number;
  type: "FIXED" | "FLEXIBLE" | "ROTATIONAL";
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
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
}

export interface CreateShiftRequest {
  name: string;
  description?: string;
  code?: string;
  startTime: string;
  endTime: string;
  workHoursMinutes?: number; // Will be calculated from startTime and endTime
  type: "FIXED" | "FLEXIBLE" | "ROTATIONAL";
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
}

export const shiftsApi = {
  getAllShifts: async (): Promise<ShiftResponse[]> => {
    return api.get("/shifts");
  },

  getActiveShifts: async (): Promise<ShiftResponse[]> => {
    return api.get("/shifts/active");
  },

  getShiftById: async (id: string): Promise<ShiftResponse> => {
    return api.get(`/shifts/${id}`);
  },

  createShift: async (data: CreateShiftRequest): Promise<ShiftResponse> => {
    return api.post("/shifts", data);
  },

  updateShift: async (id: string, data: Partial<CreateShiftRequest>): Promise<ShiftResponse> => {
    return api.put(`/shifts/${id}`, data);
  },

  deleteShift: async (id: string): Promise<void> => {
    return api.delete(`/shifts/${id}`);
  },
};
