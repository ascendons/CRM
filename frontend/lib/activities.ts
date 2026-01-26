import { Activity, CreateActivityRequest, UpdateActivityRequest, ActivityStatistics, ActivityType, ActivityStatus, ActivityPriority } from '@/types/activity';
import { ApiResponse } from '@/types/api';
import { authService } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

class ActivityService {
  private getAuthHeader() {
    const token = authService.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async createActivity(request: CreateActivityRequest): Promise<Activity> {
    const response = await fetch(`${API_URL}/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create activity');
    }

    const result: ApiResponse<Activity> = await response.json();
    return result.data;
  }

  async getAllActivities(): Promise<Activity[]> {
    const response = await fetch(`${API_URL}/activities`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }

    const result: ApiResponse<Activity[]> = await response.json();
    return result.data;
  }

  async getActivityById(id: string): Promise<Activity> {
    const response = await fetch(`${API_URL}/activities/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch activity');
    }

    const result: ApiResponse<Activity> = await response.json();
    return result.data;
  }

  async getActivityByActivityId(activityId: string): Promise<Activity> {
    const response = await fetch(`${API_URL}/activities/code/${activityId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch activity');
    }

    const result: ApiResponse<Activity> = await response.json();
    return result.data;
  }

  async getActivitiesByType(type: ActivityType): Promise<Activity[]> {
    const response = await fetch(`${API_URL}/activities/type/${type}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }

    const result: ApiResponse<Activity[]> = await response.json();
    return result.data;
  }

  async getActivitiesByStatus(status: ActivityStatus): Promise<Activity[]> {
    const response = await fetch(`${API_URL}/activities/status/${status}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }

    const result: ApiResponse<Activity[]> = await response.json();
    return result.data;
  }

  async getActivitiesByPriority(priority: ActivityPriority): Promise<Activity[]> {
    const response = await fetch(`${API_URL}/activities/priority/${priority}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }

    const result: ApiResponse<Activity[]> = await response.json();
    return result.data;
  }

  async getActivitiesByLead(leadId: string): Promise<Activity[]> {
    const response = await fetch(`${API_URL}/activities/lead/${leadId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }

    const result: ApiResponse<Activity[]> = await response.json();
    return result.data;
  }

  async getActivitiesByContact(contactId: string): Promise<Activity[]> {
    const response = await fetch(`${API_URL}/activities/contact/${contactId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }

    const result: ApiResponse<Activity[]> = await response.json();
    return result.data;
  }

  async getActivitiesByAccount(accountId: string): Promise<Activity[]> {
    const response = await fetch(`${API_URL}/activities/account/${accountId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }

    const result: ApiResponse<Activity[]> = await response.json();
    return result.data;
  }

  async getActivitiesByOpportunity(opportunityId: string): Promise<Activity[]> {
    const response = await fetch(`${API_URL}/activities/opportunity/${opportunityId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }

    const result: ApiResponse<Activity[]> = await response.json();
    return result.data;
  }

  async getActivitiesByUser(userId: string): Promise<Activity[]> {
    const response = await fetch(`${API_URL}/activities/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }

    const result: ApiResponse<Activity[]> = await response.json();
    return result.data;
  }

  async getActiveActivities(): Promise<Activity[]> {
    const response = await fetch(`${API_URL}/activities/active`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch active activities');
    }

    const result: ApiResponse<Activity[]> = await response.json();
    return result.data;
  }

  async getOverdueActivities(): Promise<Activity[]> {
    const response = await fetch(`${API_URL}/activities/overdue`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch overdue activities');
    }

    const result: ApiResponse<Activity[]> = await response.json();
    return result.data;
  }

  async searchActivities(query: string): Promise<Activity[]> {
    const response = await fetch(`${API_URL}/activities/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to search activities');
    }

    const result: ApiResponse<Activity[]> = await response.json();
    return result.data;
  }

  async updateActivity(id: string, request: UpdateActivityRequest): Promise<Activity> {
    const response = await fetch(`${API_URL}/activities/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update activity');
    }

    const result: ApiResponse<Activity> = await response.json();
    return result.data;
  }

  async deleteActivity(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/activities/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete activity');
    }
  }

  async getActivityCount(): Promise<number> {
    const response = await fetch(`${API_URL}/activities/statistics/count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch activity count');
    }

    const result: ApiResponse<number> = await response.json();
    return result.data;
  }

  async getStatistics(): Promise<ActivityStatistics> {
    const response = await fetch(`${API_URL}/activities/statistics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch statistics');
    }

    const result: ApiResponse<ActivityStatistics> = await response.json();
    return result.data;
  }
}

export const activitiesService = new ActivityService();
