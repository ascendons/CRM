"use client";

import { useState, useEffect } from "react";
import { organizationApi } from "@/lib/api/organization";
import type { Organization } from "@/types/organization";
import OrganizationProfile from "@/components/organization/OrganizationProfile";
import UsageLimitsComponent from "@/components/organization/UsageLimits";
import SubscriptionInfo from "@/components/organization/SubscriptionInfo";
import {
    Building2,
    Settings,
    CreditCard,
    BarChart3,
    Loader2,
    AlertCircle,
} from "lucide-react";

export default function OrganizationSettingsPage() {
    const [activeTab, setActiveTab] = useState("profile");
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadOrganization();
    }, []);

    const loadOrganization = async () => {
        try {
            setIsLoading(true);
            const data = await organizationApi.getCurrent();
            setOrganization(data);
        } catch (err: any) {
            setError(err.message || "Failed to load organization");
        } finally {
            setIsLoading(false);
        }
    };

    const tabs = [
        { id: "profile", label: "Profile", icon: Building2 },
        { id: "usage", label: "Usage & Limits", icon: BarChart3 },
        { id: "subscription", label: "Subscription", icon: CreditCard },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    Organization Settings
                </h1>
                <p className="text-gray-600 mt-2">
                    Manage your organization profile, usage, and subscription
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }
                `}
                            >
                                <Icon className="h-5 w-5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {activeTab === "profile" && organization && (
                    <OrganizationProfile
                        organization={organization}
                        onUpdate={loadOrganization}
                    />
                )}
                {activeTab === "usage" && organization && (
                    <UsageLimitsComponent />
                )}
                {activeTab === "subscription" && organization && (
                    <SubscriptionInfo organization={organization} />
                )}
                {activeTab === "settings" && organization && (
                    <OrganizationSettingsForm
                        organization={organization}
                        onUpdate={loadOrganization}
                    />
                )}
            </div>
        </div>
    );
}

function OrganizationSettingsForm({ organization, onUpdate }: { organization: Organization; onUpdate: () => void }) {
    const settings = organization.settings;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
                <p className="text-sm text-gray-600 mt-1">
                    Configure your organization preferences
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Date Format
                    </label>
                    <div className="text-gray-900">{settings?.dateFormat || "MM/DD/YYYY"}</div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Time Format
                    </label>
                    <div className="text-gray-900">{settings?.timeFormat || "12h"}</div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Language
                    </label>
                    <div className="text-gray-900">{settings?.language || "English"}</div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email Notifications
                    </label>
                    <div className="text-gray-900">
                        {settings?.emailNotificationsEnabled ? "Enabled" : "Disabled"}
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t text-sm text-gray-500">
                Contact support to change these settings.
            </div>
        </div>
    );
}
