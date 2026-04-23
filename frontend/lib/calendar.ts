import { api } from "./api-client";

export type EventType = "MEETING" | "CALL" | "TASK" | "REMINDER" | "OUT_OF_OFFICE" | "OTHER";
export type EventStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";
export type Recurrence = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";

export interface CalendarEvent {
  id: string;
  eventId: string;
  tenantId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  clientId?: string;
  clientName?: string;
  eventType: EventType;
  status: EventStatus;
  attendeeIds?: string[];
  attendeeNames?: string[];
  color?: string;
  isAllDay: boolean;
  recurrence: Recurrence;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  clientId?: string;
  clientName?: string;
  eventType?: EventType;
  status?: EventStatus;
  attendeeIds?: string[];
  attendeeNames?: string[];
  color?: string;
  isAllDay?: boolean;
  recurrence?: Recurrence;
}

export const calendarService = {
  createEvent: (data: CreateEventRequest) => api.post<CalendarEvent>("/calendar", data),

  updateEvent: (eventId: string, data: CreateEventRequest) =>
    api.put<CalendarEvent>(`/calendar/${eventId}`, data),

  deleteEvent: (eventId: string) => api.delete<void>(`/calendar/${eventId}`),

  getMyEvents: (from: string, to: string) =>
    api.get<CalendarEvent[]>(`/calendar/my?from=${from}&to=${to}`),

  getAllEvents: (from: string, to: string) =>
    api.get<CalendarEvent[]>(`/calendar/all?from=${from}&to=${to}`),

  getUserEvents: (userId: string, from: string, to: string) =>
    api.get<CalendarEvent[]>(`/calendar/user/${userId}?from=${from}&to=${to}`),

  getEventById: (eventId: string) => api.get<CalendarEvent>(`/calendar/${eventId}`),
};
