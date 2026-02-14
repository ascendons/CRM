"use client";

import { useState, useEffect } from "react";
import { auditLogsService } from "@/lib/auditLogs";
import { AuditLogEntry, AuditLogAction } from "@/types/auditLog";
import { showToast } from "@/lib/toast";
import {
    Clock,
    User,
    PlusCircle,
    Edit2,
    Trash2,
    CheckCircle,
    XCircle,
    LogIn,
    LogOut,
    Info,
} from "lucide-react";

interface AuditLogTimelineProps {
    entityName: string;
    entityId: string;
}

export function AuditLogTimeline({ entityName, entityId }: AuditLogTimelineProps) {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLogs();
    }, [entityName, entityId]);

    const loadLogs = async () => {
        try {
            setLoading(true);
            // Fetch latest 50 logs (or implement scrolling pagination later)
            const data = await auditLogsService.getEntityLogs(entityName, entityId, {
                page: 1,
                size: 50,
                sort: "timestamp,desc",
            });

            if ('content' in data) {
                setLogs(data.content);
            } else {
                setLogs(data);
            }
        } catch (err) {
            showToast.error("Failed to load activity history");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    const getActionIcon = (action: AuditLogAction) => {
        switch (action) {
            case AuditLogAction.CREATE:
                return <PlusCircle className="h-5 w-5 text-emerald-600" />;
            case AuditLogAction.UPDATE:
                return <Edit2 className="h-5 w-5 text-blue-600" />;
            case AuditLogAction.DELETE:
                return <Trash2 className="h-5 w-5 text-rose-600" />;
            case AuditLogAction.STATUS_CHANGE:
                return <Info className="h-5 w-5 text-amber-600" />;
            case AuditLogAction.LOGIN:
                return <LogIn className="h-5 w-5 text-indigo-600" />;
            case AuditLogAction.LOGOUT:
                return <LogOut className="h-5 w-5 text-slate-600" />;
            default:
                return <Info className="h-5 w-5 text-slate-500" />;
        }
    };

    const getActionLabel = (action: AuditLogAction) => {
        switch (action) {
            case AuditLogAction.CREATE:
                return "Created";
            case AuditLogAction.UPDATE:
                return "Updated";
            case AuditLogAction.DELETE:
                return "Deleted";
            case AuditLogAction.STATUS_CHANGE:
                return "Status Changed";
            case AuditLogAction.LOGIN:
                return "Logged In";
            case AuditLogAction.LOGOUT:
                return "Logged Out";
            default:
                return action;
        }
    };

    if (loading && logs.length === 0) {
        return (
            <div className="py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading history...</p>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="py-8 text-center text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No activity history recorded.</p>
            </div>
        );
    }

    return (
        <div className="flow-root">
            <ul className="-mb-8">
                {logs.map((log, logIdx) => (
                    <li key={log.id}>
                        <div className="relative pb-8">
                            {logIdx !== logs.length - 1 ? (
                                <span
                                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                    aria-hidden="true"
                                />
                            ) : null}
                            <div className="relative flex space-x-3">
                                <div className="bg-white rounded-full flex items-center justify-center p-1 ring-8 ring-white">
                                    {getActionIcon(log.action)}
                                </div>
                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                        <p className="text-sm text-gray-900">
                                            <span className="font-medium">{getActionLabel(log.action)}</span>{" "}
                                            by <span className="font-semibold text-gray-900">{log.userName || "Unknown"}</span>
                                        </p>
                                        {log.description && (
                                            <p className="mt-1 text-sm text-gray-500">{log.description}</p>
                                        )}
                                        {/* State Transition Display */}
                                        {(log.oldValue || log.newValue) && (
                                            <div className="mt-2 text-xs flex items-center gap-2 text-gray-600 bg-gray-50 p-2 rounded">
                                                <span className="font-medium text-gray-400 line-through">{log.oldValue || "None"}</span>
                                                <span className="text-gray-400">→</span>
                                                <span className="font-medium text-blue-600">{log.newValue || "None"}</span>
                                            </div>
                                        )}
                                        {log.action === AuditLogAction.UPDATE && log.changes && (
                                            <div className="mt-2 text-xs bg-gray-50 p-2 rounded border border-gray-100">
                                                {Object.entries(log.changes).map(([field, change]) => (
                                                    <div key={field} className="flex gap-2">
                                                        <span className="font-medium text-gray-600">{field}:</span>
                                                        <span className="text-gray-400 line-through">
                                                            {String(change.oldValue)}
                                                        </span>
                                                        <span className="text-gray-400">→</span>
                                                        <span className="text-gray-700 font-medium">
                                                            {String(change.newValue)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                        <time dateTime={log.timestamp}>{formatDate(log.timestamp)}</time>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
