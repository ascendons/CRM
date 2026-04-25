import { api } from "../api-client";
import type { DashboardStats, GrowthTrends } from "@/types/organization";
import type { OpportunityStatistics } from "@/types/opportunity";

export const analyticsApi = {
  /**
   * Get comprehensive dashboard statistics
   * Requires authentication
   */
  async getDashboardStats(): Promise<DashboardStats> {
    return api.get<DashboardStats>("/analytics/dashboard");
  },

  /**
   * Get growth trends over specified period
   * Requires authentication
   * @param days - Number of days to analyze (default: 30)
   */
  async getGrowthTrends(days: number = 30): Promise<GrowthTrends> {
    return api.get<GrowthTrends>(`/analytics/growth-trends?days=${days}`);
  },

  /**
   * Get opportunity statistics for analytics
   * Requires authentication
   */
  async getOpportunityStats(): Promise<OpportunityStatistics> {
    return api.get<OpportunityStatistics>("/opportunities/statistics");
  },
};
