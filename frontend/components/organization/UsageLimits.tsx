"use client";

import { useEffect, useState } from "react";
import { organizationApi } from "@/lib/api/organization";
import type { OrganizationUsage } from "@/types/organization";
import {
    Users,
    UserPlus,
    Building,
    DollarSign,
    Package,
    Database,
    AlertCircle,
    CheckCircle,
    Loader2,
    X,
} from "lucide-react";

export default function UsageLimits() {
    const [usage, setUsage] = useState<OrganizationUsage | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUsage();
    }, []);

    const loadUsage = async () => {
        try {
            setIsLoading(true);
            const data = await organizationApi.getUsage();
            setUsage(data);
        } catch (err) {
            console.error("Failed to load usage:", err);
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

    if (!usage) {
        return (
            <div className="text-center py-12 text-gray-500">
                Failed to load usage data
            </div>
        );
    }

    const resources = [
        { name: "Users", icon: Users, current: usage.usage.currentUsers, max: usage.limits.maxUsers, unit: "users" },
        { name: "Leads", icon: UserPlus, current: usage.usage.currentLeads, max: usage.limits.maxLeads, unit: "leads" },
        { name: "Contacts", icon: Users, current: usage.usage.currentContacts, max: usage.limits.maxContacts, unit: "contacts" },
        { name: "Accounts", icon: Building, current: usage.usage.currentAccounts, max: usage.limits.maxAccounts, unit: "accounts" },
        { name: "Opportunities", icon: DollarSign, current: usage.usage.currentOpportunities, max: usage.limits.maxOpportunities, unit: "opportunities" },
        { name: "Products", icon: Package, current: usage.usage.currentProducts, max: usage.limits.maxProducts, unit: "products" },
        { name: "Storage", icon: Database, current: usage.usage.currentStorageMB, max: usage.limits.maxStorageMB, unit: "MB" },
    ];

    const getPercentage = (current: number, max: number) => Math.round((current / max) * 100);

    const getStatusColor = (percentage: number) => {
        if (percentage >= 90) return "red";
        if (percentage >= 75) return "yellow";
        return "green";
    };

    const getProgressBarColor = (color: string) => {
        switch (color) {
            case "red": return "bg-red-600";
            case "yellow": return "bg-yellow-500";
            case "green": return "bg-green-600";
            default: return "bg-blue-600";
        }
    };

    const getTextColor = (color: string) => {
        switch (color) {
            case "red": return "text-red-600";
            case "yellow": return "text-yellow-600";
            case "green": return "text-green-600";
            default: return "text-blue-600";
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Resource Usage</h3>
                <p className="text-sm text-gray-600">
                    Current plan: <span className="font-medium">{usage.subscriptionTier}</span>
                </p>
            </div>

            {/* Usage Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resources.map((resource) => {
                    const percentage = getPercentage(resource.current, resource.max);
                    const statusColor = getStatusColor(percentage);
                    const Icon = resource.icon;

                    return (
                        <div key={resource.name} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Icon className="h-5 w-5 text-gray-600" />
                                    <h4 className="font-medium text-gray-900">{resource.name}</h4>
                                </div>
                                <span className={`text-sm font-semibold ${getTextColor(statusColor)}`}>
                                    {percentage}%
                                </span>
                            </div>

                            <div className="mb-2">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className={`h-2.5 rounded-full transition-all duration-300 ${getProgressBarColor(statusColor)}`}
                                        style={{ width: `${Math.min(percentage, 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">
                                    {resource.current.toLocaleString()} / {resource.max.toLocaleString()} {resource.unit}
                                </span>
                                {percentage >= 90 ? (
                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                ) : percentage >= 75 ? (
                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                ) : (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                            </div>

                            {percentage >= 90 && (
                                <div className="mt-2 text-xs text-red-600 font-medium">
                                    Limit almost reached - consider upgrading
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* API Usage */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-2">API Usage (Today)</h4>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                        {usage.usage.apiCallsToday.toLocaleString()} / {usage.limits.maxApiCallsPerDay.toLocaleString()} calls
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                        {getPercentage(usage.usage.apiCallsToday, usage.limits.maxApiCallsPerDay)}%
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                        className={`h-2 rounded-full ${getProgressBarColor(
                            getStatusColor(getPercentage(usage.usage.apiCallsToday, usage.limits.maxApiCallsPerDay))
                        )}`}
                        style={{
                            width: `${Math.min(
                                getPercentage(usage.usage.apiCallsToday, usage.limits.maxApiCallsPerDay),
                                100
                            )}%`,
                        }}
                    />
                </div>
            </div>

            {/* Features */}
            <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Features</h4>
                <div className="space-y-2">
                    <FeatureItem enabled={usage.limits.customFieldsEnabled} label="Custom Fields" />
                    <FeatureItem enabled={usage.limits.apiAccessEnabled} label="API Access" />
                    <FeatureItem enabled={usage.limits.advancedReportsEnabled} label="Advanced Reports" />
                </div>
            </div>

            {/* Last Updated */}
            <div className="text-xs text-gray-500 text-center">
                Last updated: {new Date(usage.usage.lastCalculated).toLocaleString()}
            </div>
        </div>
    );
}

function FeatureItem({ enabled, label }: { enabled: boolean; label: string }) {
    return (
        <div className="flex items-center gap-2">
            {enabled ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
                <X className="h-4 w-4 text-gray-400" />
            )}
            <span className={`text-sm ${enabled ? "text-gray-900" : "text-gray-500"}`}>
                {label}
            </span>
        </div>
    );
}
