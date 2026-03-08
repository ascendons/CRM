import { api } from '../api-client';

export interface CreateLocationRequest {
  name: string;
  code?: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  type?: 'HEAD_OFFICE' | 'BRANCH' | 'CLIENT_SITE' | 'COWORKING';
  enforceGeofence?: boolean;
  allowManualOverride?: boolean;
  allowRemoteCheckIn?: boolean;
  isHeadquarters?: boolean;
  isActive?: boolean;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface LocationResponse {
  id: string;
  locationId: string;
  name: string;
  code?: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  type?: string;
  enforceGeofence?: boolean;
  allowManualOverride?: boolean;
  allowRemoteCheckIn?: boolean;
  isHeadquarters?: boolean;
  isActive: boolean;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  createdAt: string;
  createdBy?: string;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
}

export interface UpdateLocationRequest extends Partial<CreateLocationRequest> {}

/**
 * API client for office location management
 */
export const locationsApi = {
  /**
   * Get all locations
   */
  getAllLocations: (): Promise<LocationResponse[]> =>
    api.get('/office-locations'),

  /**
   * Get active locations only
   */
  getActiveLocations: (): Promise<LocationResponse[]> =>
    api.get('/office-locations/active'),

  /**
   * Get location by ID
   */
  getLocationById: (locationId: string): Promise<LocationResponse> =>
    api.get(`/office-locations/${locationId}`),

  /**
   * Create new location
   */
  createLocation: (data: CreateLocationRequest): Promise<LocationResponse> =>
    api.post('/office-locations', data),

  /**
   * Update location
   */
  updateLocation: (locationId: string, data: UpdateLocationRequest): Promise<LocationResponse> =>
    api.put(`/office-locations/${locationId}`, data),

  /**
   * Delete location
   */
  deleteLocation: (locationId: string): Promise<void> =>
    api.delete(`/office-locations/${locationId}`)
};
