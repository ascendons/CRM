import { api } from "./api-client";
import type { ProfileResponse, CreateProfileRequest, UpdateProfileRequest } from "@/types/profile";

export const profilesService = {
  async createProfile(data: CreateProfileRequest): Promise<ProfileResponse> {
    return api.post("/profiles", data);
  },

  async getAllProfiles(activeOnly = false): Promise<ProfileResponse[]> {
    return api.get(`/profiles?activeOnly=${activeOnly}`);
  },

  async getProfileById(id: string): Promise<ProfileResponse> {
    return api.get(`/profiles/${id}`);
  },

  async getProfileByProfileId(profileId: string): Promise<ProfileResponse> {
    return api.get(`/profiles/code/${profileId}`);
  },

  async searchProfiles(query: string): Promise<ProfileResponse[]> {
    return api.get(`/profiles/search?query=${encodeURIComponent(query)}`);
  },

  async updateProfile(id: string, data: UpdateProfileRequest): Promise<ProfileResponse> {
    return api.put(`/profiles/${id}`, data);
  },

  async deleteProfile(id: string): Promise<void> {
    return api.delete(`/profiles/${id}`);
  },
};
