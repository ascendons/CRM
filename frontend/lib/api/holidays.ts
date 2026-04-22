import { api } from "../api-client";

export interface CreateHolidayRequest {
  date: string;
  name: string;
  description?: string;
  type: "NATIONAL" | "REGIONAL" | "OPTIONAL" | "COMPANY_SPECIFIC";
  applicableLocations?: string[];
  applicableStates?: string[];
  isOptional?: boolean;
  maxOptionalAllowed?: number;
}

export interface HolidayResponse {
  id: string;
  tenantId: string;
  date: string;
  year: number;
  name: string;
  description?: string;
  type: string;
  applicableLocations: string[];
  applicableStates: string[];
  isOptional: boolean;
  maxOptionalAllowed?: number;
  createdAt: string;
  createdBy: string;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
}

/**
 * API client for holiday management
 */
export const holidaysApi = {
  /**
   * Create holiday
   */
  createHoliday: (data: CreateHolidayRequest) => api.post<HolidayResponse>("/holidays", data),

  /**
   * Update holiday
   */
  updateHoliday: (holidayId: string, data: CreateHolidayRequest) =>
    api.put<HolidayResponse>(`/holidays/${holidayId}`, data),

  /**
   * Delete holiday
   */
  deleteHoliday: (holidayId: string) => api.delete<void>(`/holidays/${holidayId}`),

  /**
   * Get holiday by ID
   */
  getHolidayById: (holidayId: string) => api.get<HolidayResponse>(`/holidays/${holidayId}`),

  /**
   * Get holidays by year
   */
  getHolidaysByYear: (year: number) => api.get<HolidayResponse[]>(`/holidays/year/${year}`),

  /**
   * Get all holidays
   */
  getAllHolidays: () => api.get<HolidayResponse[]>("/holidays"),
};
