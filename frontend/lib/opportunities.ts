import { Opportunity, CreateOpportunityRequest, UpdateOpportunityRequest, OpportunityStatistics, OpportunityStage } from '@/types/opportunity';
import { ApiResponse } from '@/types/api';
import { authService } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

class OpportunityService {
  private getAuthHeader() {
    const token = authService.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async createOpportunity(request: CreateOpportunityRequest): Promise<Opportunity> {
    const response = await fetch(`${API_URL}/opportunities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create opportunity');
    }

    const result: ApiResponse<Opportunity> = await response.json();
    return result.data;
  }

  async getAllOpportunities(): Promise<Opportunity[]> {
    const response = await fetch(`${API_URL}/opportunities`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch opportunities');
    }

    const result: ApiResponse<Opportunity[]> = await response.json();
    return result.data;
  }

  async getOpportunityById(id: string): Promise<Opportunity> {
    const response = await fetch(`${API_URL}/opportunities/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch opportunity');
    }

    const result: ApiResponse<Opportunity> = await response.json();
    return result.data;
  }

  async getOpportunityByOpportunityId(opportunityId: string): Promise<Opportunity> {
    const response = await fetch(`${API_URL}/opportunities/code/${opportunityId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch opportunity');
    }

    const result: ApiResponse<Opportunity> = await response.json();
    return result.data;
  }

  async getOpportunitiesByAccount(accountId: string): Promise<Opportunity[]> {
    const response = await fetch(`${API_URL}/opportunities/account/${accountId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch opportunities');
    }

    const result: ApiResponse<Opportunity[]> = await response.json();
    return result.data;
  }

  async getOpportunitiesByContact(contactId: string): Promise<Opportunity[]> {
    const response = await fetch(`${API_URL}/opportunities/contact/${contactId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch opportunities');
    }

    const result: ApiResponse<Opportunity[]> = await response.json();
    return result.data;
  }

  async getOpportunitiesByStage(stage: OpportunityStage): Promise<Opportunity[]> {
    const response = await fetch(`${API_URL}/opportunities/stage/${stage}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch opportunities');
    }

    const result: ApiResponse<Opportunity[]> = await response.json();
    return result.data;
  }

  async searchOpportunities(query: string): Promise<Opportunity[]> {
    const response = await fetch(`${API_URL}/opportunities/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to search opportunities');
    }

    const result: ApiResponse<Opportunity[]> = await response.json();
    return result.data;
  }

  async updateOpportunity(id: string, request: UpdateOpportunityRequest): Promise<Opportunity> {
    const response = await fetch(`${API_URL}/opportunities/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update opportunity');
    }

    const result: ApiResponse<Opportunity> = await response.json();
    return result.data;
  }

  async deleteOpportunity(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/opportunities/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete opportunity');
    }
  }

  async getOpportunityCount(): Promise<number> {
    const response = await fetch(`${API_URL}/opportunities/statistics/count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch opportunity count');
    }

    const result: ApiResponse<number> = await response.json();
    return result.data;
  }

  async getStatistics(): Promise<OpportunityStatistics> {
    const response = await fetch(`${API_URL}/opportunities/statistics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch statistics');
    }

    const result: ApiResponse<OpportunityStatistics> = await response.json();
    return result.data;
  }
}

export const opportunitiesService = new OpportunityService();
