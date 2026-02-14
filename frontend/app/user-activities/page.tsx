"use client";

import { useState, useEffect } from "react";
import { ActionType, UserActivity } from "@/types/user-activity";
import { userActivityService } from "@/lib/user-activity";
import { format } from "date-fns";
import {
    Activity,
    Search,
    Filter,
    Clock,
    Monitor,
    Globe
} from "lucide-react";

export default function UserActivityPage() {
    const [activities, setActivities] = useState<UserActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState<ActionType | "">("");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        fetchActivities();
    }, [page, actionFilter]);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const data = await userActivityService.getMyActivities({
                page,
                size: 20,
                actionType: actionFilter || undefined,
            });
            setActivities(data.content);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error("Failed to load activities", error);
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (type: ActionType) => {
        switch (type) {
            case ActionType.CREATE: return "bg-green-100 text-green-700 border-green-200";
            case ActionType.UPDATE: return "bg-blue-100 text-blue-700 border-blue-200";
            case ActionType.DELETE: return "bg-red-100 text-red-700 border-red-200";
            case ActionType.LOGIN: return "bg-purple-100 text-purple-700 border-purple-200";
            case ActionType.PAGE_VIEW: return "bg-gray-100 text-gray-700 border-gray-200";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    const getIcon = (type: ActionType) => {
        switch (type) {
            case ActionType.PAGE_VIEW: return <Monitor className="w-4 h-4" />;
            case ActionType.LOGIN: return <Globe className="w-4 h-4" />; // Or User icon
            default: return <Activity className="w-4 h-4" />;
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
                <p className="text-slate-500 mt-1">Track your recent actions and system events.</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex gap-4 items-center">
                <div className="flex items-center gap-2 text-slate-500">
                    <Filter className="w-5 h-5" />
                    <span className="text-sm font-medium">Filter by:</span>
                </div>

                <select
                    className="border-slate-300 rounded-lg text-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                    value={actionFilter}
                    onChange={(e) => {
                        setActionFilter(e.target.value as ActionType | "");
                        setPage(0); // Reset to first page
                    }}
                >
                    <option value="">All Actions</option>
                    {Object.values(ActionType).map((type) => (
                        <option key={type} value={type}>{type.replace(/_/g, " ")}</option>
                    ))}
                </select>

                {/* Add Date Range picker later if needed */}
                <button
                    onClick={() => fetchActivities()}
                    className="ml-auto p-2 hover:bg-slate-50 rounded-lg text-slate-500"
                >
                    <Search className="w-5 h-5" />
                </button>
            </div>

            {/* Activity List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-slate-500">Loading activities...</div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500">
                        No activities found matching your criteria.
                    </div>
                ) : (
                    activities.map((activity) => (
                        <div key={activity.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4">
                                    <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center border ${getActionColor(activity.actionType)}`}>
                                        {getIcon(activity.actionType)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-slate-900">{activity.actionType.replace(/_/g, " ")}</span>
                                            {activity.entityType && (
                                                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                                                    {activity.entityType}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-slate-600 text-sm">{activity.description}</p>

                                        {/* State Transition Display */}
                                        {(activity.oldValue || activity.newValue) && (
                                            <div className="mt-2 text-xs flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded w-fit">
                                                <span className="font-medium text-slate-400 line-through">
                                                    {activity.oldValue || "None"}
                                                </span>
                                                <span className="text-slate-400">→</span>
                                                <span className="font-medium text-blue-600">
                                                    {activity.newValue || "None"}
                                                </span>
                                            </div>
                                        )}

                                        {/* Metadata / Details */}
                                        <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-400">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {format(new Date(activity.timestamp), "MMM d, yyyy h:mm a")}
                                            </div>
                                            {activity.ipAddress && <span>IP: {activity.ipAddress}</span>}
                                            {activity.requestUrl && <span className="max-w-xs truncate" title={activity.requestUrl}>URL: {activity.requestUrl}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex justify-center gap-2">
                <button
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-slate-50"
                >
                    Previous
                </button>
                <div className="px-4 py-2 text-sm text-slate-500">
                    Page {page + 1} of {totalPages || 1}
                </div>
                <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-slate-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
