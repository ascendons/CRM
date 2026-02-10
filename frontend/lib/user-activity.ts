import { ActionType, UserActivity } from "@/types/user-activity";
import { authService } from "./auth";
import { ApiResponse, PaginatedResponse } from "@/types/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

interface GetActivitiesParams {
    page?: number;
    size?: number;
    actionType?: ActionType;
    entityType?: string;
    startDate?: string; // ISO String
    endDate?: string;   // ISO String
}

class UserActivityService {
    private getAuthHeader(): Record<string, string> {
        const token = authService.getToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    async getMyActivities(params: GetActivitiesParams = {}): Promise<PaginatedResponse<UserActivity>> {
        const queryParams = new URLSearchParams();
        if (params.page !== undefined) queryParams.append("page", params.page.toString());
        if (params.size !== undefined) queryParams.append("size", params.size.toString());
        if (params.actionType) queryParams.append("actionType", params.actionType);
        if (params.entityType) queryParams.append("entityType", params.entityType);
        if (params.startDate) queryParams.append("startDate", params.startDate);
        if (params.endDate) queryParams.append("endDate", params.endDate);

        const response = await fetch(`${API_URL}/user-activities/me?${queryParams.toString()}`, {
            headers: {
                "Content-Type": "application/json",
                ...this.getAuthHeader(),
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch activities");
        }

        const result: ApiResponse<PaginatedResponse<UserActivity>> = await response.json();
        if (!result.data) {
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
        return result.data;
    }

    async getMyStats(startDate?: string, endDate?: string): Promise<Record<string, any>> {
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append("startDate", startDate);
        if (endDate) queryParams.append("endDate", endDate);

        const response = await fetch(`${API_URL}/user-activities/stats/me?${queryParams.toString()}`, {
            headers: {
                "Content-Type": "application/json",
                ...this.getAuthHeader(),
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch activity stats");
        }

        const result: ApiResponse<Record<string, any>> = await response.json();
        return result.data || {};
    }

    async logPageView(pageUrl: string, pageTitle: string, previousPage?: string): Promise<void> {
        try {
            await fetch(`${API_URL}/user-activities/page-view`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...this.getAuthHeader(),
                },
                body: JSON.stringify({
                    pageUrl,
                    pageTitle,
                    previousPage,
                }),
            });
        } catch (error) {
            console.error("Failed to log page view", error);
            // Non-blocking, silence error
        }
    }
}

export const userActivityService = new UserActivityService();
