import { api } from '@/lib/api-client';
import type {
    Organization,
    OrganizationRegistrationRequest,
    OrganizationRegistrationResponse,
    SubdomainAvailability,
    OrganizationUsage,
    OrganizationSettings,
} from '@/types/organization';

export const organizationApi = {
    /**
     * Register new organization
     * Public endpoint - no auth required
     */
    register: async (data: OrganizationRegistrationRequest): Promise<OrganizationRegistrationResponse> => {
        return api.post<OrganizationRegistrationResponse>('/organizations/register', data);
    },

    /**
     * Check subdomain availability
     * Public endpoint - no auth required
     */
    checkSubdomain: async (subdomain: string): Promise<SubdomainAvailability> => {
        return api.get<SubdomainAvailability>(`/organizations/check-subdomain/${subdomain}`);
    },

    /**
     * Get current organization details
     * Requires authentication
     */
    getCurrent: async (): Promise<Organization> => {
        return api.get<Organization>('/organizations/me');
    },

    /**
     * Get organization usage and limits
     * Requires authentication
     */
    getUsage: async (): Promise<OrganizationUsage> => {
        return api.get<OrganizationUsage>('/organizations/usage');
    },

    /**
     * Get subscription details
     * Requires authentication
     */
    getSubscription: async (): Promise<any> => {
        return api.get('/organizations/subscription');
    },

    /**
     * Update organization settings (Admin only)
     */
    updateSettings: async (settings: Partial<OrganizationSettings>): Promise<Organization> => {
        return api.put<Organization>('/organizations/settings', settings);
    },

    /**
     * Update organization profile (Admin only)
     */
    updateProfile: async (data: {
        organizationName?: string;
        displayName?: string;
        industry?: string;
        companySize?: string;
        primaryEmail?: string;
        primaryPhone?: string;
    }): Promise<Organization> => {
        return api.put<Organization>('/organizations/profile', data);
    },
};
