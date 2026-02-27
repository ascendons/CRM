"use client";

import { useState } from "react";
import { organizationApi } from "@/lib/api/organization";
import type { Organization } from "@/types/organization";
import { Industry } from "@/types/lead";
import { ApiError } from "@/lib/api-client";
import {
    Building2,
    Mail,
    Phone,
    Globe,
    Calendar,
    Edit2,
    Save,
    X,
    Loader2,
    CheckCircle,
    AlertCircle,
} from "lucide-react";

interface OrganizationProfileProps {
    organization: Organization;
    onUpdate: () => void;
}

export default function OrganizationProfile({
    organization,
    onUpdate,
}: OrganizationProfileProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        organizationName: organization.organizationName,
        displayName: organization.displayName || "",
        industry: organization.industry || "",
        companySize: organization.companySize || "",
        primaryEmail: organization.primaryEmail,
        primaryPhone: organization.primaryPhone || "",
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSave = async () => {
        setError("");
        setSuccess("");
        setIsSaving(true);

        try {
            await organizationApi.updateProfile(formData);
            setSuccess("Profile updated successfully");
            setIsEditing(false);
            onUpdate();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError("Failed to update profile");
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            organizationName: organization.organizationName,
            displayName: organization.displayName || "",
            industry: organization.industry || "",
            companySize: organization.companySize || "",
            primaryEmail: organization.primaryEmail,
            primaryPhone: organization.primaryPhone || "",
        });
        setIsEditing(false);
        setError("");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        Organization Profile
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Manage your organization&apos;s basic information
                    </p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        <Edit2 className="h-4 w-4" />
                        Edit Profile
                    </button>
                )}
            </div>

            {/* Messages */}
            {success && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <p className="text-sm font-medium text-green-800">{success}</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                </div>
            )}

            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Organization Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Organization Name *
                    </label>
                    {isEditing ? (
                        <input
                            type="text"
                            name="organizationName"
                            value={formData.organizationName}
                            onChange={handleChange}
                            className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                            required
                        />
                    ) : (
                        <div className="flex items-center gap-2 text-gray-900">
                            <Building2 className="h-5 w-5 text-gray-400" />
                            {organization.organizationName}
                        </div>
                    )}
                </div>

                {/* Display Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Display Name
                    </label>
                    {isEditing ? (
                        <input
                            type="text"
                            name="displayName"
                            value={formData.displayName}
                            onChange={handleChange}
                            className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                            placeholder="Optional display name"
                        />
                    ) : (
                        <div className="text-gray-900">
                            {organization.displayName || "-"}
                        </div>
                    )}
                </div>

                {/* Subdomain (Read-only) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Subdomain
                    </label>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Globe className="h-5 w-5 text-gray-400" />
                        {organization.subdomain}.ascendons.com
                    </div>
                </div>

                {/* Status (Read-only) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Status
                    </label>
                    <div>
                        <span
                            className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${organization.status === "ACTIVE"
                                ? "bg-green-100 text-green-800"
                                : organization.status === "TRIAL"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                        >
                            {organization.status}
                        </span>
                    </div>
                </div>

                {/* Industry */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Industry
                    </label>
                    {isEditing ? (
                        <select
                            name="industry"
                            value={formData.industry}
                            onChange={handleChange}
                            className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                        >
                            <option value="">Select industry</option>
                            {Object.values(Industry).map((val) => (
                                <option key={val} value={val}>
                                    {val.replace(/_/g, " ")}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className="text-gray-900">{organization.industry || "-"}</div>
                    )}
                </div>

                {/* Company Size */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Company Size
                    </label>
                    {isEditing ? (
                        <select
                            name="companySize"
                            value={formData.companySize}
                            onChange={handleChange}
                            className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                        >
                            <option value="">Select size</option>
                            <option value="1-10">1-10 employees</option>
                            <option value="11-50">11-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201-500">201-500 employees</option>
                            <option value="500+">500+ employees</option>
                        </select>
                    ) : (
                        <div className="text-gray-900">{organization.companySize || "-"}</div>
                    )}
                </div>

                {/* Primary Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Primary Email *
                    </label>
                    {isEditing ? (
                        <input
                            type="email"
                            name="primaryEmail"
                            value={formData.primaryEmail}
                            onChange={handleChange}
                            className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                            required
                        />
                    ) : (
                        <div className="flex items-center gap-2 text-gray-900">
                            <Mail className="h-5 w-5 text-gray-400" />
                            {organization.primaryEmail}
                        </div>
                    )}
                </div>

                {/* Primary Phone */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Primary Phone
                    </label>
                    {isEditing ? (
                        <input
                            type="tel"
                            name="primaryPhone"
                            value={formData.primaryPhone}
                            onChange={handleChange}
                            className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                            placeholder="+1 (555) 123-4567"
                        />
                    ) : (
                        <div className="flex items-center gap-2 text-gray-900">
                            <Phone className="h-5 w-5 text-gray-400" />
                            {organization.primaryPhone || "-"}
                        </div>
                    )}
                </div>

                {/* Created At (Read-only) */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Created
                    </label>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        {new Date(organization.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </div>
                </div>
            </div>

            {/* Actions */}
            {isEditing && (
                <div className="flex items-center gap-3 pt-4 border-t">
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
                            <>
                                <Save className="h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                        <X className="h-4 w-4" />
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
}
