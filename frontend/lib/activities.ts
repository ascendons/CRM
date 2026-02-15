import { api } from './api-client';
import { Activity, CreateActivityRequest, UpdateActivityRequest, ActivityStatistics, ActivityType, ActivityStatus, ActivityPriority } from '@/types/activity';

export const activitiesService = {
  async createActivity(request: CreateActivityRequest): Promise<Activity> {
    return await api.post<Activity>('/activities', request);
  },

  async getAllActivities(): Promise<Activity[]> {
    const response = await api.get<any>('/activities');
    return response?.content || response || [];
  },

  async getActivityById(id: string): Promise<Activity> {
    return await api.get<Activity>(`/activities/${id}`);
  },

  async getActivityByActivityId(activityId: string): Promise<Activity> {
    return await api.get<Activity>(`/activities/code/${activityId}`);
  },

  async getActivitiesByType(type: ActivityType): Promise<Activity[]> {
    return await api.get<Activity[]>(`/activities/type/${type}`);
  },

  async getActivitiesByStatus(status: ActivityStatus): Promise<Activity[]> {
    return await api.get<Activity[]>(`/activities/status/${status}`);
  },

  async getActivitiesByPriority(priority: ActivityPriority): Promise<Activity[]> {
    return await api.get<Activity[]>(`/activities/priority/${priority}`);
  },

  async getActivitiesByLead(leadId: string): Promise<Activity[]> {
    return await api.get<Activity[]>(`/activities/lead/${leadId}`);
  },

  async getActivitiesByContact(contactId: string): Promise<Activity[]> {
    return await api.get<Activity[]>(`/activities/contact/${contactId}`);
  },

  async getActivitiesByAccount(accountId: string): Promise<Activity[]> {
    return await api.get<Activity[]>(`/activities/account/${accountId}`);
  },

  async getActivitiesByOpportunity(opportunityId: string): Promise<Activity[]> {
    return await api.get<Activity[]>(`/activities/opportunity/${opportunityId}`);
  },

  async getActivitiesByUser(userId: string): Promise<Activity[]> {
    return await api.get<Activity[]>(`/activities/user/${userId}`);
  },

  async getActiveActivities(): Promise<Activity[]> {
    return await api.get<Activity[]>('/activities/active');
  },

  async getOverdueActivities(): Promise<Activity[]> {
    return await api.get<Activity[]>('/activities/overdue');
  },

  async searchActivities(query: string): Promise<Activity[]> {
    return await api.get<Activity[]>(`/activities/search?q=${encodeURIComponent(query)}`);
  },

  async updateActivity(id: string, request: UpdateActivityRequest): Promise<Activity> {
    return await api.put<Activity>(`/activities/${id}`, request);
  },

  async deleteActivity(id: string): Promise<void> {
    return await api.delete<void>(`/activities/${id}`);
  },

  async getActivityCount(): Promise<number> {
    return await api.get<number>('/activities/statistics/count');
  },

  async getStatistics(): Promise<ActivityStatistics> {
    return await api.get<ActivityStatistics>('/activities/statistics');
  },
};
