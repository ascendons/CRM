import { api } from "./api-client";
import type { ProfileResponse, CreateProfileRequest, UpdateProfileRequest } from "@/types/profile";

/**
 * Profiles service - manages profile CRUD operations via API
 */
export const profilesService = {
  async createProfile(data: CreateProfileRequest): Promise<ProfileResponse> {
    const response = await api.post<ProfileResponse>("/profiles", data);
    return response;
  },

  async getAllProfiles(activeOnly = false): Promise<ProfileResponse[]> {
    const response = await api.get<ProfileResponse[]>(`/profiles?activeOnly=${activeOnly}`);
    return response;
  },

  async getProfileById(id: string): Promise<ProfileResponse> {
    const response = await api.get<ProfileResponse>(`/profiles/${id}`);
    return response;
  },

  async getProfileByProfileId(profileId: string): Promise<ProfileResponse> {
    const response = await api.get<ProfileResponse>(`/profiles/code/${profileId}`);
    return response;
  },

  async searchProfiles(query: string): Promise<ProfileResponse[]> {
    const response = await api.get<ProfileResponse[]>(
      `/profiles/search?query=${encodeURIComponent(query)}`
    );
    return response;
  },

  async updateProfile(id: string, data: UpdateProfileRequest): Promise<ProfileResponse> {
    const response = await api.put<ProfileResponse>(`/profiles/${id}`, data);
    return response;
  },

  async deleteProfile(id: string): Promise<void> {
    await api.delete(`/profiles/${id}`);
  },
};
