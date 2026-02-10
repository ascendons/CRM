import { api } from '../api-client';
import type {
    Invitation,
    InvitationRequest,
    AcceptInvitationRequest,
} from '@/types/organization';

export const invitationApi = {
    /**
     * Send invitation to user
     * Admin only
     */
    async send(data: InvitationRequest): Promise<Invitation> {
        return api.post<Invitation>('/invitations/send', data);
    },

    /**
     * Get all invitations for current organization
     * Admin only
     */
    async getAll(): Promise<Invitation[]> {
        return api.get<Invitation[]>('/invitations');
    },

    /**
     * Get pending invitations
     * Admin only
     */
    async getPending(): Promise<Invitation[]> {
        return api.get<Invitation[]>('/invitations/pending');
    },

    /**
     * Revoke invitation
     * Admin only
     */
    async revoke(invitationId: string): Promise<void> {
        return api.delete(`/invitations/${invitationId}/revoke`);
    },

    /**
     * Get invitation by ID (for acceptance page)
     * Public endpoint - no auth required
     */
    async getById(invitationId: string): Promise<Invitation> {
        return api.get<Invitation>(`/invitations/${invitationId}`);
    },

    /**
     * Accept invitation and create user account
     * Public endpoint - no auth required
     */
    async accept(
        invitationId: string,
        data: AcceptInvitationRequest
    ): Promise<{
        userId: string;
        token: string;
        message: string;
    }> {
        return api.post(`/invitations/${invitationId}/accept`, data);
    },
};
