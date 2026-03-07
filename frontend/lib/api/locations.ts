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

export interface UpdateLocationRequest extends Partial<CreateLocationRequest> {}

/**
 * API client for office location management
 */
export const locationsApi = {
  /**
   * Get all locations
   */
  getAllLocations: () =>
    api.get('/office-locations'),

  /**
   * Get active locations only
   */
  getActiveLocations: () =>
    api.get('/office-locations/active'),

  /**
   * Get location by ID
   */
  getLocationById: (locationId: string) =>
    api.get(`/office-locations/${locationId}`),

  /**
   * Create new location
   */
  createLocation: (data: CreateLocationRequest) =>
    api.post('/office-locations', data),

  /**
   * Update location
   */
  updateLocation: (locationId: string, data: UpdateLocationRequest) =>
    api.put(`/office-locations/${locationId}`, data),

  /**
   * Delete location
   */
  deleteLocation: (locationId: string) =>
    api.delete(`/office-locations/${locationId}`)
};
