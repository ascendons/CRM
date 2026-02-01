import { api } from "./api-client";
import type {
  ProposalResponse,
  CreateProposalRequest,
  ProposalStatus,
  ProposalSource,
} from "@/types/proposal";

/**
 * Service for managing proposals/quotations
 */
export const proposalsService = {
  /**
   * Create a new proposal
   */
  async createProposal(data: CreateProposalRequest): Promise<ProposalResponse> {
    return api.post("/proposals", data);
  },

  /**
   * Get all proposals
   */
  async getAllProposals(): Promise<ProposalResponse[]> {
    return api.get("/proposals");
  },

  /**
   * Get proposal by ID
   */
  async getProposalById(id: string): Promise<ProposalResponse> {
    return api.get(`/proposals/${id}`);
  },

  /**
   * Get proposals by source (Lead or Opportunity)
   */
  async getProposalsBySource(
    source: ProposalSource,
    sourceId: string
  ): Promise<ProposalResponse[]> {
    return api.get(`/proposals/source/${source}/${sourceId}`);
  },

  /**
   * Get proposals by status
   */
  async getProposalsByStatus(status: ProposalStatus): Promise<ProposalResponse[]> {
    return api.get(`/proposals/status/${status}`);
  },

  /**
   * Get proposals by owner
   */
  async getProposalsByOwner(ownerId: string): Promise<ProposalResponse[]> {
    return api.get(`/proposals/owner/${ownerId}`);
  },

  /**
   * Send proposal to customer (DRAFT -> SENT)
   */
  async sendProposal(id: string): Promise<ProposalResponse> {
    return api.post(`/proposals/${id}/send`, {});
  },

  /**
   * Accept proposal (SENT -> ACCEPTED)
   */
  async acceptProposal(id: string): Promise<ProposalResponse> {
    return api.post(`/proposals/${id}/accept`, {});
  },

  /**
   * Reject proposal (SENT -> REJECTED)
   */
  async rejectProposal(id: string, reason: string): Promise<ProposalResponse> {
    return api.post(`/proposals/${id}/reject?reason=${encodeURIComponent(reason)}`, {});
  },

  /**
   * Delete proposal (soft delete)
   */
  async deleteProposal(id: string): Promise<void> {
    return api.delete(`/proposals/${id}`);
  },
};
