import {
  Opportunity,
  CreateOpportunityRequest,
  UpdateOpportunityRequest,
  OpportunityStatistics,
  OpportunityStage,
} from "@/types/opportunity";
import { api } from "./api-client";

// API_URL is handled by api-client
// authService is handled by api-client

class OpportunityService {

  async createOpportunity(request: CreateOpportunityRequest): Promise<Opportunity> {
    return api.post<Opportunity>("/opportunities", request);
  }

  async getAllOpportunities(): Promise<Opportunity[]> {
    // Request "all" (large page) to ensure we get a list for dropdowns if backend paginates by default
    const params = new URLSearchParams();
    params.append("size", "1000");

    // Check if backend treats no-params as "List" or "Page". 
    // Safest is to handle "content" property via api-client return.
    // Note: api-client returns `data.data` from ApiResponse. 
    // If backend returns Page, `data.data` is the Page object.

    const response = await api.get<any>(`/opportunities?${params.toString()}`);

    // Handle Page<Opportunity> vs List<Opportunity>
    if (response && response.content && Array.isArray(response.content)) {
      return response.content;
    }

    return Array.isArray(response) ? response : [];
  }

  async getOpportunityById(id: string): Promise<Opportunity> {
    return api.get<Opportunity>(`/opportunities/${id}`);
  }

  async getOpportunityByOpportunityId(opportunityId: string): Promise<Opportunity> {
    return api.get<Opportunity>(`/opportunities/code/${opportunityId}`);
  }

  async getOpportunitiesByAccount(accountId: string): Promise<Opportunity[]> {
    return api.get<Opportunity[]>(`/opportunities/account/${accountId}`);
  }

  async getOpportunitiesByContact(contactId: string): Promise<Opportunity[]> {
    return api.get<Opportunity[]>(`/opportunities/contact/${contactId}`);
  }

  async getOpportunitiesByStage(stage: OpportunityStage): Promise<Opportunity[]> {
    return api.get<Opportunity[]>(`/opportunities/stage/${stage}`);
  }

  async searchOpportunities(query: string): Promise<Opportunity[]> {
    return api.get<Opportunity[]>(`/opportunities/search?q=${encodeURIComponent(query)}`);
  }

  async updateOpportunity(id: string, request: UpdateOpportunityRequest): Promise<Opportunity> {
    return api.put<Opportunity>(`/opportunities/${id}`, request);
  }

  async deleteOpportunity(id: string): Promise<void> {
    return api.delete<void>(`/opportunities/${id}`);
  }

  async getOpportunityCount(): Promise<number> {
    return api.get<number>("/opportunities/statistics/count");
  }

  async getStatistics(): Promise<OpportunityStatistics> {
    return api.get<OpportunityStatistics>("/opportunities/statistics");
  }
}

export const opportunitiesService = new OpportunityService();
