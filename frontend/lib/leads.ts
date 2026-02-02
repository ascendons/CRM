import { api } from "./api-client";
import {
  Lead,
  CreateLeadRequest,
  UpdateLeadRequest,
  LeadStatistics,
  LeadStatus,
} from "@/types/lead";

export const leadsService = {
  /**
   * Create a new lead
   */
  async createLead(data: CreateLeadRequest): Promise<Lead> {
    return await api.post<Lead>("/leads", data);
  },

  async getAllLeads(pagination?: any): Promise<Lead[]> {
    const params = new URLSearchParams();
    if (pagination) {
      // Add pagination params if needed, but current signature didn't have it. 
      // Keeping it simple to fix the dropdown issue.
    } else {
      params.append("size", "1000");
    }

    // Check if backend treats no-params as "List" or "Page". 
    // Safest is to handle "content" property.
    const response = await api.get<any>(`/leads?${params.toString()}`);

    if (response && response.content && Array.isArray(response.content)) {
      return response.content;
    }
    return Array.isArray(response) ? response : [];
  },

  /**
   * Get lead by ID
   */
  async getLeadById(id: string): Promise<Lead> {
    return await api.get<Lead>(`/leads/${id}`);
  },

  /**
   * Get lead by leadId (LEAD-YYYY-MM-XXXXX)
   */
  async getLeadByLeadId(leadId: string): Promise<Lead> {
    return await api.get<Lead>(`/leads/code/${leadId}`);
  },

  /**
   * Get my leads (current user)
   */
  async getMyLeads(): Promise<Lead[]> {
    return await api.get<Lead[]>("/leads/my-leads");
  },

  /**
   * Get leads by status
   */
  async getLeadsByStatus(status: LeadStatus): Promise<Lead[]> {
    return await api.get<Lead[]>(`/leads/status/${status}`);
  },

  /**
   * Search leads
   */
  async searchLeads(searchTerm: string): Promise<Lead[]> {
    return await api.get<Lead[]>(`/leads/search?q=${encodeURIComponent(searchTerm)}`);
  },

  /**
   * Update lead information
   */
  async updateLead(id: string, data: UpdateLeadRequest): Promise<Lead> {
    return await api.put<Lead>(`/leads/${id}`, data);
  },

  /**
   * Update lead status
   */
  async updateLeadStatus(id: string, status: LeadStatus): Promise<Lead> {
    return await api.put<Lead>(`/leads/${id}/status?status=${status}`, {});
  },

  /**
   * Convert lead to opportunity
   */
  async convertLead(id: string): Promise<Lead> {
    return await api.post<Lead>(`/leads/${id}/convert`, {});
  },

  /**
   * Delete lead
   */
  async deleteLead(id: string): Promise<void> {
    return await api.delete<void>(`/leads/${id}`);
  },

  /**
   * Get lead statistics
   */
  async getStatistics(): Promise<LeadStatistics> {
    return await api.get<LeadStatistics>("/leads/stats");
  },
};
