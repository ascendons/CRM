"use client";

import { useState } from "react";
import DashboardStats from "@/components/analytics/DashboardStats";
import GrowthTrends from "@/components/analytics/GrowthTrends";
import { formatLocaleIST } from "@/lib/utils/date";
import {
    BarChart3,
    TrendingUp,
    Download,
    RefreshCw,
    Calendar,
} from "lucide-react";

export default function AnalyticsPage() {
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <BarChart3 className="h-8 w-8 text-blue-600" />
                            Analytics Dashboard
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Track your organization&apos;s performance and growth
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefresh}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                            <Download className="h-4 w-4" />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Key Metrics
                </h2>
                <DashboardStats refreshKey={refreshKey} />
            </div>

            {/* Growth Trends */}
            <div className="mb-8">
                <GrowthTrends />
            </div>

            {/* Additional Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity Timeline */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            Recent Activity
                        </h3>
                    </div>
                    <p className="text-sm text-gray-500">
                        Activity timeline coming soon...
                    </p>
                </div>

                {/* Performance Insights */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            Performance Insights
                        </h3>
                    </div>
                    <p className="text-sm text-gray-500">
                        AI-powered insights coming soon...
                    </p>
                </div>
            </div>

            {/* Last Updated */}
            <div className="mt-6 text-center text-xs text-gray-500">
                Last updated: {formatLocaleIST(new Date())}
            </div>
        </div>
    );
}
