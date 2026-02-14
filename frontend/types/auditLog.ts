export enum AuditLogAction {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    STATUS_CHANGE = "STATUS_CHANGE",
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",
}

export interface AuditLogEntry {
    id: string;
    entityName: string; // e.g., "PROPOSAL", "PRODUCT"
    entityId: string;
    action: AuditLogAction;
    userName: string; // Backend calls it userName
    timestamp: string; // ISO Date
    description?: string; // Backend calls it description
    oldValue?: string;
    newValue?: string;
    changes?: Record<string, { oldValue: any; newValue: any }>;
}

export interface AuditLogResponse {
    logs: AuditLogEntry[];
}
