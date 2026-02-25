import { api } from "./api-client";
import type {
  ProposalResponse,
  CreateProposalRequest,
  UpdateProposalRequest,
  ProposalStatus,
  ProposalSource,
} from "@/types/proposal";
import type { Page, PaginationParams } from "@/types/common";

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
   * Update a proposal (DRAFT only)
   */
  async updateProposal(id: string, data: UpdateProposalRequest): Promise<ProposalResponse> {
    return api.put(`/proposals/${id}`, data);
  },

  /**
   * Get all proposals
   */
  async getAllProposals(pagination?: PaginationParams): Promise<Page<ProposalResponse> | ProposalResponse[]> {
    const params = new URLSearchParams();
    if (pagination) {
      if (pagination.page !== undefined) params.append("page", String(pagination.page - 1));
      if (pagination.size !== undefined) params.append("size", String(pagination.size));
      if (pagination.sort) params.append("sort", pagination.sort);
    }
    return api.get(pagination ? `/proposals?${params.toString()}` : "/proposals");
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
    sourceId: string,
    pagination?: PaginationParams
  ): Promise<Page<ProposalResponse> | ProposalResponse[]> {
    const params = new URLSearchParams();
    if (pagination) {
      if (pagination.page !== undefined) params.append("page", String(pagination.page - 1));
      if (pagination.size !== undefined) params.append("size", String(pagination.size));
      if (pagination.sort) params.append("sort", pagination.sort);
    }
    return api.get(`/proposals/source/${source}/${sourceId}?${params.toString()}`);
  },

  /**
   * Get proposals by status
   */
  async getProposalsByStatus(status: ProposalStatus, pagination?: PaginationParams): Promise<Page<ProposalResponse> | ProposalResponse[]> {
    const params = new URLSearchParams();
    if (pagination) {
      if (pagination.page !== undefined) params.append("page", String(pagination.page - 1));
      if (pagination.size !== undefined) params.append("size", String(pagination.size));
      if (pagination.sort) params.append("sort", pagination.sort);
    }
    return api.get(`/proposals/status/${status}?${params.toString()}`);
  },

  /**
   * Search proposals
   */
  async searchProposals(query: string, pagination?: PaginationParams): Promise<Page<ProposalResponse> | ProposalResponse[]> {
    const params = new URLSearchParams();
    params.append("q", query);
    if (pagination) {
      if (pagination.page !== undefined) params.append("page", String(pagination.page - 1));
      if (pagination.size !== undefined) params.append("size", String(pagination.size));
      if (pagination.sort) params.append("sort", pagination.sort);
    }
    return api.get(`/proposals/search?${params.toString()}`);
  },

  /**
   * Get proposals by owner
   */
  async getProposalsByOwner(ownerId: string, pagination?: PaginationParams): Promise<Page<ProposalResponse> | ProposalResponse[]> {
    const params = new URLSearchParams();
    if (pagination) {
      if (pagination.page !== undefined) params.append("page", String(pagination.page - 1));
      if (pagination.size !== undefined) params.append("size", String(pagination.size));
      if (pagination.sort) params.append("sort", pagination.sort);
    }
    return api.get(`/proposals/owner/${ownerId}?${params.toString()}`);
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

  /**
   * Download proposal invoice PDF (legacy)
   */
  async downloadInvoice(id: string): Promise<Blob> {
    return api.download(`/proposals/${id}/pdf`);
  },

  /**
   * Get available invoice templates
   */
  async getAvailableTemplates(id: string): Promise<Array<{
    type: string;
    displayName: string;
    description: string;
    available: boolean;
  }>> {
    return api.get(`/proposals/${id}/invoice/templates`);
  },

  /**
   * Get invoice HTML preview content
   */
  async getInvoicePreviewHtml(id: string, template: string): Promise<string> {
    return api.fetchHtml(`/proposals/${id}/invoice/preview?template=${template}`);
  },

  /**
   * Download invoice PDF with template
   */
  async downloadInvoiceWithTemplate(id: string, template: string): Promise<Blob> {
    return api.download(`/proposals/${id}/invoice/download?template=${template}`);
  },

  /**
   * Get version history for a proposal
   */
  async getVersionHistory(id: string): Promise<import("@/types/proposal-version").ProposalVersionResponse[]> {
    return api.get(`/proposals/${id}/versions`);
  },

  /**
   * Get a specific version of a proposal
   */
  async getVersion(id: string, version: number): Promise<import("@/types/proposal-version").ProposalVersionResponse> {
    return api.get(`/proposals/${id}/versions/${version}`);
  },
};
