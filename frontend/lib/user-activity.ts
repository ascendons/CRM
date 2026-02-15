import { api } from "./api-client";
import { ActionType, UserActivity } from "@/types/user-activity";
import { PaginatedResponse } from "@/types/auth";

interface GetActivitiesParams {
    page?: number;
    size?: number;
    actionType?: ActionType;
    entityType?: string;
    startDate?: string; // ISO String
    endDate?: string;   // ISO String
}

export const userActivityService = {
    async getMyActivities(params: GetActivitiesParams = {}): Promise<PaginatedResponse<UserActivity>> {
        const queryParams = new URLSearchParams();
        if (params.page !== undefined) queryParams.append("page", params.page.toString());
        if (params.size !== undefined) queryParams.append("size", params.size.toString());
        if (params.actionType) queryParams.append("actionType", params.actionType);
        if (params.entityType) queryParams.append("entityType", params.entityType);
        if (params.startDate) queryParams.append("startDate", params.startDate);
        if (params.endDate) queryParams.append("endDate", params.endDate);

        const response = await api.get<PaginatedResponse<UserActivity>>(`/user-activities/me?${queryParams.toString()}`);

        if (!response) {
            // Return empty pagination structure if no data
            return {
                content: [],
                pageNumber: params.page || 0,
                pageSize: params.size || 10,
                totalElements: 0,
                totalPages: 0,
                last: true,
                first: true,
                empty: true
            };
        }
        return response;
    },

    async getMyStats(startDate?: string, endDate?: string): Promise<Record<string, any>> {
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append("startDate", startDate);
        if (endDate) queryParams.append("endDate", endDate);

        return await api.get<Record<string, any>>(`/user-activities/stats/me?${queryParams.toString()}`);
    },

    async logPageView(pageUrl: string, pageTitle: string, previousPage?: string): Promise<void> {
        try {
            await api.post("/user-activities/page-view", {
                pageUrl,
                pageTitle,
                previousPage,
            });
        } catch (error) {
            console.error("Failed to log page view", error);
            // Non-blocking, silence error
        }
    }
};
