import { api } from "./api-client";
import { AuditLogEntry } from "@/types/auditLog";
import { Page, PaginationParams } from "@/types/common";

export const auditLogsService = {
    /**
     * Get audit logs for a specific entity
     */
    async getEntityLogs(
        entityName: string,
        entityId: string,
        pagination?: PaginationParams
    ): Promise<Page<AuditLogEntry> | AuditLogEntry[]> {
        const params = new URLSearchParams();
        if (pagination) {
            if (pagination.page !== undefined) params.append("page", String(pagination.page - 1));
            if (pagination.size !== undefined) params.append("size", String(pagination.size));
            if (pagination.sort) params.append("sort", pagination.sort);
        }
        // Assuming backend endpoint /audit-logs/{entityName}/{entityId}
        return api.get(`/audit-logs/${entityName}/${entityId}?${params.toString()}`);
    },

    /**
     * Get all audit logs
     */
    async getAllLogs(pagination?: PaginationParams): Promise<Page<AuditLogEntry> | AuditLogEntry[]> {
        const params = new URLSearchParams();
        if (pagination) {
            if (pagination.page !== undefined) params.append("page", String(pagination.page - 1));
            if (pagination.size !== undefined) params.append("size", String(pagination.size));
            if (pagination.sort) params.append("sort", pagination.sort);
        }
        return api.get(`/audit-logs?${params.toString()}`);
    }
};
