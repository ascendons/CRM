export enum ActionType {
    // API Operations
    CREATE = "CREATE",
    READ = "READ",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    SEARCH = "SEARCH",
    EXPORT = "EXPORT",
    IMPORT = "IMPORT",

    // Page Navigation
    PAGE_VIEW = "PAGE_VIEW",

    // Authentication
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",

    // Other Actions
    DOWNLOAD = "DOWNLOAD",
    UPLOAD = "UPLOAD",
    SHARE = "SHARE",
    PRINT = "PRINT",
    CUSTOM = "CUSTOM"
}

export interface UserActivity {
    id: string;
    activityId: string;
    userId: string;
    userName: string;
    actionType: ActionType;
    action: string;
    entityType?: string;
    entityId?: string;
    entityName?: string;
    description: string;
    oldValue?: string;
    newValue?: string;
    timestamp: string; // ISO Date String
    ipAddress?: string;
    userAgent?: string;
    requestUrl?: string;
    httpMethod?: string;
    metadata?: Record<string, any>;
}

export interface UserActivityStats {
    // Maps are dynamic in JS/TS
    [key: string]: any;
}
