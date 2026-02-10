"use client";

import { useState, useEffect } from "react";
import { analyticsApi } from "@/lib/api/analytics";
import type { GrowthTrends as GrowthTrendsType } from "@/types/organization";
import {
    TrendingUp,
    UserPlus,
    Users,
    DollarSign,
    Loader2,
} from "lucide-react";

export default function GrowthTrends() {
    const [period, setPeriod] = useState(30);
    const [trends, setTrends] = useState<GrowthTrendsType | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTrends();
    }, [period]);

    const loadTrends = async () => {
        try {
            setIsLoading(true);
            const data = await analyticsApi.getGrowthTrends(period);
            setTrends(data);
        } catch (err) {
            console.error("Failed to load growth trends:", err);
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

    if (!trends) return null;

    const growthData = [
        { label: "Leads", value: trends.leadGrowth, icon: UserPlus, color: "blue" },
        { label: "Contacts", value: trends.contactGrowth, icon: Users, color: "green" },
        { label: "Opportunities", value: trends.opportunityGrowth, icon: DollarSign, color: "purple" },
    ];

    const maxValue = Math.max(
        trends.leadGrowth,
        trends.contactGrowth,
        trends.opportunityGrowth,
        1
    );

    const getBarColor = (color: string) => {
        switch (color) {
            case "blue": return "bg-blue-500";
            case "green": return "bg-green-500";
            case "purple": return "bg-purple-500";
            default: return "bg-gray-500";
        }
    };

    const getIconColor = (color: string) => {
        switch (color) {
            case "blue": return "text-blue-600";
            case "green": return "text-green-600";
            case "purple": return "text-purple-600";
            default: return "text-gray-600";
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Growth Trends
                        </h3>
                        <p className="text-sm text-gray-600">
                            Growth over {trends.period}
                        </p>
                    </div>
                </div>

                {/* Period Selector */}
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    {[7, 30, 90].map((days) => (
                        <button
                            key={days}
                            onClick={() => setPeriod(days)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${period === days
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            {days}d
                        </button>
                    ))}
                </div>
            </div>

            {/* Growth Bars */}
            <div className="space-y-6">
                {growthData.map((item) => {
                    const Icon = item.icon;
                    const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

                    return (
                        <div key={item.label}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Icon className={`h-5 w-5 ${getIconColor(item.color)}`} />
                                    <span className="text-sm font-medium text-gray-700">
                                        {item.label}
                                    </span>
                                </div>
                                <span className="text-lg font-bold text-gray-900">
                                    +{item.value.toLocaleString()}
                                </span>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className={`h-3 rounded-full transition-all duration-500 ${getBarColor(item.color)}`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Growth</span>
                    <span className="font-semibold text-gray-900">
                        +
                        {(
                            trends.leadGrowth +
                            trends.contactGrowth +
                            trends.opportunityGrowth
                        ).toLocaleString()}{" "}
                        records
                    </span>
                </div>
            </div>
        </div>
    );
}
