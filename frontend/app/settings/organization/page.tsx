"use client";

import { useState, useEffect } from "react";
import { organizationApi } from "@/lib/api/organization";
import type { Organization } from "@/types/organization";
import OrganizationProfile from "@/components/organization/OrganizationProfile";
import UsageLimitsComponent from "@/components/organization/UsageLimits";
import SubscriptionInfo from "@/components/organization/SubscriptionInfo";
import InvoiceSettingsForm from "@/components/organization/InvoiceSettingsForm";
import {
    Building2,
    Settings,
    CreditCard,
    BarChart3,
    Loader2,
    AlertCircle,
    FileText,
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
        { id: "settings", label: "Settings", icon: Settings },
        { id: "invoice", label: "Invoice", icon: FileText },
        { id: "usage", label: "Usage & Limits", icon: BarChart3 },
        { id: "subscription", label: "Subscription", icon: CreditCard },
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
                {activeTab === "settings" && organization && (
                    <OrganizationSettingsForm
                        organization={organization}
                        onUpdate={loadOrganization}
                    />
                )}
                {activeTab === "invoice" && organization && (
                    <InvoiceSettingsForm
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
            </div>
        </div>
    );
}

function OrganizationSettingsForm({ organization, onUpdate }: { organization: Organization; onUpdate: () => void }) {
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        dateFormat: organization.settings?.dateFormat || "MM/DD/YYYY",
        timeFormat: organization.settings?.timeFormat || "12h",
        language: organization.settings?.language || "English",
        emailNotificationsEnabled: organization.settings?.emailNotificationsEnabled ?? true,
        logoUrl: organization.settings?.logoUrl || "",
        brandColor: organization.settings?.brandColor || "#2563eb",
        monthlyRevenueGoal: organization.settings?.monthlyRevenueGoal ?? 1000000,
        defaultPaymentTerms: organization.settings?.defaultPaymentTerms || "",
        defaultDeliveryTerms: organization.settings?.defaultDeliveryTerms || "",
        defaultNotes: organization.settings?.defaultNotes || "",
    });

    // Also update local state when organization prop changes
    useEffect(() => {
        setFormData({
            dateFormat: organization.settings?.dateFormat || "MM/DD/YYYY",
            timeFormat: organization.settings?.timeFormat || "12h",
            language: organization.settings?.language || "English",
            emailNotificationsEnabled: organization.settings?.emailNotificationsEnabled ?? true,
            logoUrl: organization.settings?.logoUrl || "",
            brandColor: organization.settings?.brandColor || "#2563eb",
            monthlyRevenueGoal: organization.settings?.monthlyRevenueGoal ?? 1000000,
            defaultPaymentTerms: organization.settings?.defaultPaymentTerms || "",
            defaultDeliveryTerms: organization.settings?.defaultDeliveryTerms || "",
            defaultNotes: organization.settings?.defaultNotes || "",
        });
    }, [organization]);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setError("");
        setSuccess("");
        setIsSaving(true);

        try {
            await organizationApi.updateSettings(formData);
            setSuccess("Settings updated successfully");
            onUpdate();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err: any) {
            setError(err.message || "Failed to update settings");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Configure branding and regional preferences
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        "Save Changes"
                    )}
                </button>
            </div>

            {success && (
                <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-200">
                    {success}
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Logo URL
                    </label>
                    <input
                        type="url"
                        value={formData.logoUrl}
                        onChange={(e) => handleChange("logoUrl", e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Publicly accessible URL for your organization logo
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Brand Color
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={formData.brandColor}
                            onChange={(e) => handleChange("brandColor", e.target.value)}
                            className="h-9 w-9 p-1 border border-gray-200 rounded-lg cursor-pointer"
                        />
                        <input
                            type="text"
                            value={formData.brandColor}
                            onChange={(e) => handleChange("brandColor", e.target.value)}
                            placeholder="#000000"
                            className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 uppercase"
                            maxLength={7}
                        />
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Monthly Revenue Goal (₹)
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">₹</span>
                        </div>
                        <input
                            type="number"
                            value={formData.monthlyRevenueGoal}
                            onChange={(e) => handleChange("monthlyRevenueGoal", parseInt(e.target.value) || 0)}
                            min="0"
                            placeholder="1000000"
                            className="block w-full pl-7 pr-12 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">INR</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Monthly revenue target shown on the dashboard performance widget
                    </p>
                </div>

                <div className="col-span-full border-t pt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Localization</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Date Format
                            </label>
                            <select
                                value={formData.dateFormat}
                                onChange={(e) => handleChange("dateFormat", e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                            >
                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Time Format
                            </label>
                            <select
                                value={formData.timeFormat}
                                onChange={(e) => handleChange("timeFormat", e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                            >
                                <option value="12h">12-hour (AM/PM)</option>
                                <option value="24h">24-hour</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Language
                            </label>
                            <select
                                value={formData.language}
                                onChange={(e) => handleChange("language", e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                            >
                                <option value="English">English</option>
                                <option value="Spanish">Spanish</option>
                                <option value="French">French</option>
                                <option value="German">German</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email Notifications
                            </label>
                            <div className="flex items-center gap-2 mt-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.emailNotificationsEnabled}
                                        onChange={(e) => handleChange("emailNotificationsEnabled", e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    <span className="ml-3 text-sm font-medium text-gray-700">
                                        {formData.emailNotificationsEnabled ? "Enabled" : "Disabled"}
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Default Terms & Conditions for Proposals */}
                <div className="col-span-full border-t pt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Default Terms & Conditions</h4>
                    <p className="text-xs text-gray-500 mb-4">These will be auto-filled when creating new proposals. Users can override per proposal.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Terms</label>
                            <textarea
                                value={formData.defaultPaymentTerms}
                                onChange={(e) => handleChange("defaultPaymentTerms", e.target.value)}
                                placeholder="e.g., 50% advance, 50% on delivery"
                                rows={4}
                                className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Terms</label>
                            <textarea
                                value={formData.defaultDeliveryTerms}
                                onChange={(e) => handleChange("defaultDeliveryTerms", e.target.value)}
                                placeholder="e.g., Delivery within 30 days"
                                rows={4}
                                className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                            <textarea
                                value={formData.defaultNotes}
                                onChange={(e) => handleChange("defaultNotes", e.target.value)}
                                placeholder="e.g., Prices are subject to change..."
                                rows={4}
                                className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
