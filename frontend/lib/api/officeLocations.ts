import { api } from "../api-client";

export interface CreateOfficeLocationRequest {
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  shape?: "CIRCLE" | "POLYGON";
  enforceGeofence?: boolean;
  allowManualOverride?: boolean;
  type: "HEAD_OFFICE" | "BRANCH" | "CLIENT_SITE" | "COWORKING" | "REMOTE";
  isHeadquarters?: boolean;
  isActive?: boolean;
  allowRemoteCheckIn?: boolean;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface UpdateOfficeLocationRequest extends Partial<CreateOfficeLocationRequest> {}

export const officeLocationsApi = {
  // CRUD operations
  create: (data: CreateOfficeLocationRequest) => api.post("/office-locations", data),

  update: (id: string, data: UpdateOfficeLocationRequest) =>
    api.put(`/office-locations/${id}`, data),

  delete: (id: string) => api.delete(`/office-locations/${id}`),

  getById: (id: string) => api.get(`/office-locations/${id}`),

  getAll: () => api.get("/office-locations"),

  getActive: () => api.get("/office-locations/active"),
};
