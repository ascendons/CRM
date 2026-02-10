"use client";

import { useState, useEffect } from "react";
import { analyticsApi } from "@/lib/api/analytics";
import type { DashboardStats as DashboardStatsType } from "@/types/organization";
import {
    Users,
    UserPlus,
    DollarSign,
    Activity,
    Loader2,
    TrendingUp,
} from "lucide-react";

interface DashboardStatsProps {
    refreshKey?: number;
}

export default function DashboardStats({ refreshKey }: DashboardStatsProps) {
    const [stats, setStats] = useState<DashboardStatsType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadStats();
    }, [refreshKey]);

    const loadStats = async () => {
        try {
            setIsLoading(true);
            setError("");
            const data = await analyticsApi.getDashboardStats();
            setStats(data);
        } catch (err: any) {
            setError(err.message || "Failed to load stats");
            console.error("Failed to load dashboard stats:", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-800">{error}</p>
            </div>
        );
    }

    if (!stats) return null;

    const metrics = [
        {
            label: "Total Leads",
            value: stats.totalLeads,
            icon: UserPlus,
            bgColor: "bg-blue-50",
            iconColor: "text-blue-600",
        },
        {
            label: "Total Contacts",
            value: stats.totalContacts,
            icon: Users,
            bgColor: "bg-green-50",
            iconColor: "text-green-600",
        },
        {
            label: "Total Opportunities",
            value: stats.totalOpportunities,
            icon: DollarSign,
            bgColor: "bg-purple-50",
            iconColor: "text-purple-600",
        },
        {
            label: "Total Activities",
            value: stats.totalActivities,
            icon: Activity,
            bgColor: "bg-orange-50",
            iconColor: "text-orange-600",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                    <div
                        key={metric.label}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">
                                    {metric.label}
                                </p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {metric.value.toLocaleString()}
                                </p>
                            </div>
                            <div
                                className={`h-12 w-12 ${metric.bgColor} rounded-xl flex items-center justify-center`}
                            >
                                <Icon className={`h-6 w-6 ${metric.iconColor}`} />
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-1 text-sm text-green-600">
                            <TrendingUp className="h-4 w-4" />
                            <span className="font-medium">Active</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
