import { api } from "./api-client";
import {
  LeadAssignmentConfig,
  UpdateLeadAssignmentConfigRequest,
  AssignLeadRequest,
} from "@/types/leadAssignment";
import { Lead } from "@/types/lead";

export const leadAssignmentService = {
  /**
   * Get current lead assignment configuration
   */
  async getConfiguration(): Promise<LeadAssignmentConfig> {
    return await api.get<LeadAssignmentConfig>("/lead-assignment-config");
  },

  /**
   * Update lead assignment configuration
   */
  async updateConfiguration(data: UpdateLeadAssignmentConfigRequest): Promise<LeadAssignmentConfig> {
    return await api.put<LeadAssignmentConfig>("/lead-assignment-config", data);
  },

  /**
   * Manually assign lead to a user
   */
  async assignLead(leadId: string, data: AssignLeadRequest): Promise<Lead> {
    return await api.post<Lead>(`/leads/${leadId}/assign`, data);
  },
};
