import { api } from "./api-client";

export interface EngineerSchedule {
  id: string;
  engineerId: string;
  engineerName?: string;
  date: string;
  availability: "AVAILABLE" | "ON_JOB" | "LEAVE" | "TRAVEL" | "TRAINING";
  slots: { workOrderId: string; startTime: string; endTime: string; status: string }[];
}

export interface AvailableEngineer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  availability: "AVAILABLE" | "ON_JOB" | "LEAVE" | "TRAVEL" | "TRAINING";
}

export interface DispatchRequest {
  workOrderId: string;
  engineerId: string;
  estimatedArrivalMinutes?: number;
  notes?: string;
}

export interface ReassignRequest {
  workOrderId: string;
  fromEngineerId: string;
  toEngineerId: string;
  reason: string;
}

export interface GeoLocation {
  engineerId: string;
  engineerName?: string;
  lat: number;
  lng: number;
  accuracy?: number;
  workOrderId?: string;
  timestamp: string;
}

export interface TechnicianSkill {
  id: string;
  userId: string;
  skillName: string;
  certificationBody: string;
  certNumber: string;
  issueDate: string;
  expiryDate: string;
  proficiencyLevel: "TRAINEE" | "COMPETENT" | "EXPERT";
  verifiedBy: string;
}

export interface CreateSkillRequest {
  userId: string;
  skillName: string;
  certificationBody: string;
  certNumber: string;
  issueDate: string;
  expiryDate: string;
  proficiencyLevel: "TRAINEE" | "COMPETENT" | "EXPERT";
}

export interface TrainingRecord {
  id: string;
  userId: string;
  trainingName: string;
  trainingType: "INTERNAL" | "EXTERNAL" | "OEM";
  completedDate: string;
  trainerName: string;
  score: number;
  passed: boolean;
}

export interface CreateTrainingRequest {
  userId: string;
  trainingName: string;
  trainingType: "INTERNAL" | "EXTERNAL" | "OEM";
  completedDate: string;
  trainerName: string;
  score: number;
  passed: boolean;
}

export interface PartsRequest {
  id: string;
  requestNumber: string;
  workOrderId: string;
  engineerId: string;
  requestedAt: string;
  requestedParts: { partId: string; qty: number; reason: string }[];
  status: "PENDING" | "APPROVED" | "REJECTED" | "DISPATCHED" | "RECEIVED";
  approvedBy: string;
  warehouseId: string;
  dispatchedAt: string;
  receivedAt: string;
}

export interface CreatePartsRequestBody {
  workOrderId: string;
  engineerId: string;
  requestedParts: { partId: string; qty: number; reason: string }[];
  warehouseId?: string;
}

export const dispatchService = {
  // Dispatch / Schedules
  getAllSchedules: (date: string) =>
    api.get<EngineerSchedule[]>(`/dispatch/schedules?date=${date}`),
  getEngineerSchedule: (engineerId: string, date: string) =>
    api.get<EngineerSchedule>(`/dispatch/schedules/${engineerId}?date=${date}`),
  dispatchWorkOrder: (data: DispatchRequest) => api.post<void>("/dispatch/dispatch", data),
  reassignWorkOrder: (data: ReassignRequest) => api.post<void>("/dispatch/reassign", data),
  getAvailableEngineers: (date: string) =>
    api.get<AvailableEngineer[]>(`/dispatch/schedules/available?date=${date}`),

  // Geo
  getAllLocations: () => api.get<GeoLocation[]>("/geo/locations"),
  getEngineerLocation: (engineerId: string) => api.get<GeoLocation>(`/geo/location/${engineerId}`),

  // Skill Matrix
  getSkills: (userId: string) => api.get<TechnicianSkill[]>(`/skill-matrix/skills/${userId}`),
  addSkill: (data: CreateSkillRequest) => api.post<TechnicianSkill>("/skill-matrix/skills", data),
  deleteSkill: (id: string) => api.delete<void>(`/skill-matrix/skills/${id}`),
  getTraining: (userId: string) => api.get<TrainingRecord[]>(`/skill-matrix/training/${userId}`),
  addTraining: (data: CreateTrainingRequest) =>
    api.post<TrainingRecord>("/skill-matrix/training", data),

  // Parts Requests
  getAllPartsRequests: () => api.get<PartsRequest[]>("/parts-requests"),
  getPartsByEngineer: (engineerId: string) =>
    api.get<PartsRequest[]>(`/parts-requests/engineer/${engineerId}`),
  getPartsByWorkOrder: (workOrderId: string) =>
    api.get<PartsRequest[]>(`/parts-requests/work-order/${workOrderId}`),
  createPartsRequest: (data: CreatePartsRequestBody) =>
    api.post<PartsRequest>("/parts-requests", data),
  approvePartsRequest: (id: string) => api.post<PartsRequest>(`/parts-requests/${id}/approve`, {}),
  rejectPartsRequest: (id: string, reason: string) =>
    api.post<PartsRequest>(`/parts-requests/${id}/reject`, { reason }),
  dispatchPartsRequest: (id: string) =>
    api.post<PartsRequest>(`/parts-requests/${id}/dispatch`, {}),
  receivePartsRequest: (id: string) => api.post<PartsRequest>(`/parts-requests/${id}/receive`, {}),
};
