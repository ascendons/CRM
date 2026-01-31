import { api } from "./api-client";
import type { ProfileResponse, CreateProfileRequest, UpdateProfileRequest } from "@/types/profile";
import * as PredefinedProfiles from "./predefined-profiles";

/**
 * Profiles service using predefined enums instead of database
 * All read operations use local predefined profiles
 * Write operations are disabled (profiles are hardcoded)
 */
export const profilesService = {
  async createProfile(data: CreateProfileRequest): Promise<ProfileResponse> {
    // Profiles are predefined - cannot create new profiles
    throw new Error("Cannot create profiles - profiles are predefined in code");
  },

  async getAllProfiles(activeOnly = false): Promise<ProfileResponse[]> {
    // Use predefined profiles instead of API call
    return Promise.resolve(activeOnly ? PredefinedProfiles.getActiveProfiles() : PredefinedProfiles.getAllProfiles());
  },

  async getProfileById(id: string): Promise<ProfileResponse> {
    // Use predefined profiles instead of API call
    const profile = PredefinedProfiles.getProfileById(id);
    if (!profile) {
      throw new Error(`Profile not found with id: ${id}`);
    }
    return Promise.resolve(profile);
  },

  async getProfileByProfileId(profileId: string): Promise<ProfileResponse> {
    // Use predefined profiles instead of API call
    const profile = PredefinedProfiles.getProfileById(profileId);
    if (!profile) {
      throw new Error(`Profile not found with profileId: ${profileId}`);
    }
    return Promise.resolve(profile);
  },

  async searchProfiles(query: string): Promise<ProfileResponse[]> {
    // Use predefined profiles instead of API call
    return Promise.resolve(PredefinedProfiles.searchProfiles(query));
  },

  async updateProfile(id: string, data: UpdateProfileRequest): Promise<ProfileResponse> {
    // Profiles are predefined - cannot update profiles
    throw new Error("Cannot update profiles - profiles are predefined in code");
  },

  async deleteProfile(id: string): Promise<void> {
    // Profiles are predefined - cannot delete profiles
    throw new Error("Cannot delete profiles - profiles are predefined in code");
  },
};
