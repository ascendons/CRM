# Phase 3: Organization Management (Important)

## Overview

**Duration**: 4 days
**Tasks**: 4 (TASK-015 to TASK-018)
**Priority**: 🟡 Important
**Dependencies**: Phase 1, Phase 2 complete

This phase builds comprehensive organization management features allowing admins to view and update organization settings, monitor usage limits, manage profiles, and track subscriptions.

---

## What You'll Build

1. ✅ Organization Settings Page with tabs
2. ✅ Usage Limits Component with visual progress bars
3. ✅ Organization Profile Component with editing
4. ✅ Subscription Info Component with plan details

---

## Success Criteria

By the end of Phase 3, you will have:
- [x] Full organization settings management
- [x] Real-time usage monitoring
- [x] Organization profile editing
- [x] Subscription status display
- [x] Professional admin interface

---

## Task List

- [TASK-015](#task-015-create-organization-settings-page) - Settings Page (2 hours)
- [TASK-016](#task-016-create-usage-limits-component) - Usage Limits (1.5 hours)
- [TASK-017](#task-017-create-organization-profile-component) - Profile Component (2 hours)
- [TASK-018](#task-018-create-subscription-info-component) - Subscription Info (1.5 hours)

**Total Time**: ~7 hours actual coding + testing

---

## TASK-015: Create Organization Settings Page

**Priority**: 🟡 Important
**Estimated Time**: 2 hours
**Dependencies**: Phase 1, Phase 2
**Files**: `app/settings/organization/page.tsx` (NEW)

### Description
Create comprehensive organization settings page with tabbed navigation.

### Requirements
1. Tabbed interface (Profile, Usage, Subscription, Settings)
2. Admin-only access
3. Beautiful UI with proper layout
4. Navigation between tabs
5. Loading states

### Implementation

**File**: `app/settings/organization/page.tsx` (NEW FILE)

```typescript
"use client";

import { useState, useEffect } from "react";
import { useTenant } from "@/lib/hooks/useTenant";
import { organizationApi } from "@/lib/api/organization";
import type { Organization } from "@/types/organization";
import {
  Building2,
  Settings,
  CreditCard,
  BarChart3,
  Loader2,
} from "lucide-react";

export default function OrganizationSettingsPage() {
  const { tenantId, organizationName } = useTenant();
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
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
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
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
          <UsageLimits organization={organization} />
        )}
        {activeTab === "subscription" && organization && (
          <SubscriptionInfo organization={organization} />
        )}
        {activeTab === "settings" && organization && (
          <OrganizationSettings
            organization={organization}
            onUpdate={loadOrganization}
          />
        )}
      </div>
    </div>
  );
}

// Placeholder components (will be replaced in next tasks)
function OrganizationProfile({ organization, onUpdate }: any) {
  return <div className="text-gray-500">Profile component - see TASK-017</div>;
}

function UsageLimits({ organization }: any) {
  return <div className="text-gray-500">Usage component - see TASK-016</div>;
}

function SubscriptionInfo({ organization }: any) {
  return <div className="text-gray-500">Subscription component - see TASK-018</div>;
}

function OrganizationSettings({ organization, onUpdate }: any) {
  return <div className="text-gray-500">Settings component - coming soon</div>;
}
```

### Acceptance Criteria
- [x] Tabbed navigation works
- [x] Loads organization data
- [x] Professional layout
- [x] Loading states
- [x] Error handling
- [x] Responsive design

### Testing
```bash
1. Navigate to /settings/organization
2. See tabbed interface
3. Click between tabs
4. Verify data loads
5. Check responsive layout
```

---

## TASK-016: Create Usage Limits Component

**Priority**: 🟡 Important
**Estimated Time**: 1.5 hours
**Dependencies**: TASK-015
**Files**: `components/organization/UsageLimits.tsx` (NEW)

### Description
Create component to display usage vs limits with progress bars.

### Requirements
1. Visual progress bars for each resource
2. Color-coded warnings (green, yellow, red)
3. Real-time usage data
4. Percentage calculations
5. Upgrade prompts when near limits

### Implementation

**File**: `components/organization/UsageLimits.tsx` (NEW FILE)

```typescript
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
} from "lucide-react";

interface UsageLimitsProps {
  organization?: any;
}

export default function UsageLimits({ organization }: UsageLimitsProps) {
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
    {
      name: "Users",
      icon: Users,
      current: usage.usage.currentUsers,
      max: usage.limits.maxUsers,
      unit: "users",
    },
    {
      name: "Leads",
      icon: UserPlus,
      current: usage.usage.currentLeads,
      max: usage.limits.maxLeads,
      unit: "leads",
    },
    {
      name: "Contacts",
      icon: Users,
      current: usage.usage.currentContacts,
      max: usage.limits.maxContacts,
      unit: "contacts",
    },
    {
      name: "Accounts",
      icon: Building,
      current: usage.usage.currentAccounts,
      max: usage.limits.maxAccounts,
      unit: "accounts",
    },
    {
      name: "Opportunities",
      icon: DollarSign,
      current: usage.usage.currentOpportunities,
      max: usage.limits.maxOpportunities,
      unit: "opportunities",
    },
    {
      name: "Products",
      icon: Package,
      current: usage.usage.currentProducts,
      max: usage.limits.maxProducts,
      unit: "products",
    },
    {
      name: "Storage",
      icon: Database,
      current: usage.usage.currentStorageMB,
      max: usage.limits.maxStorageMB,
      unit: "MB",
    },
  ];

  const getPercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return "red";
    if (percentage >= 75) return "yellow";
    return "green";
  };

  const getProgressBarColor = (color: string) => {
    switch (color) {
      case "red":
        return "bg-red-600";
      case "yellow":
        return "bg-yellow-500";
      case "green":
        return "bg-green-600";
      default:
        return "bg-blue-600";
    }
  };

  const getTextColor = (color: string) => {
    switch (color) {
      case "red":
        return "text-red-600";
      case "yellow":
        return "text-yellow-600";
      case "green":
        return "text-green-600";
      default:
        return "text-blue-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Resource Usage
        </h3>
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
            <div
              key={resource.name}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-gray-600" />
                  <h4 className="font-medium text-gray-900">{resource.name}</h4>
                </div>
                <span className={`text-sm font-semibold ${getTextColor(statusColor)}`}>
                  {percentage}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${getProgressBarColor(statusColor)}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
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

              {/* Warning message */}
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
          <FeatureItem
            enabled={usage.limits.customFieldsEnabled}
            label="Custom Fields"
          />
          <FeatureItem
            enabled={usage.limits.apiAccessEnabled}
            label="API Access"
          />
          <FeatureItem
            enabled={usage.limits.advancedReportsEnabled}
            label="Advanced Reports"
          />
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
```

### Acceptance Criteria
- [x] Visual progress bars for all resources
- [x] Color-coded status (green/yellow/red)
- [x] Percentage calculations
- [x] Warning messages for high usage
- [x] Features list
- [x] Responsive layout

### Testing
```bash
1. Navigate to /settings/organization
2. Click "Usage & Limits" tab
3. See all resource usage bars
4. Verify colors match usage levels
5. Check warnings for high usage
```

---

## TASK-017: Create Organization Profile Component

**Priority**: 🟡 Important
**Estimated Time**: 2 hours
**Dependencies**: TASK-015
**Files**: `components/organization/OrganizationProfile.tsx` (NEW)

### Description
Create component for viewing and editing organization profile.

### Requirements
1. View mode and edit mode
2. Form validation
3. Save changes to API
4. Success/error messages
5. Loading states

### Implementation

**File**: `components/organization/OrganizationProfile.tsx` (NEW FILE)

```typescript
"use client";

import { useState } from "react";
import { organizationApi } from "@/lib/api/organization";
import type { Organization } from "@/types/organization";
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

      // Clear success message after 3 seconds
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
            Manage your organization's basic information
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
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
              className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
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
            {organization.subdomain}.yourcrm.com
          </div>
        </div>

        {/* Status (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Status
          </label>
          <div>
            <span
              className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                organization.status === "ACTIVE"
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
              className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select industry</option>
              <option value="Technology">Technology</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Finance">Finance</option>
              <option value="Retail">Retail</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Other">Other</option>
            </select>
          ) : (
            <div className="text-gray-900">
              {organization.industry || "-"}
            </div>
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
              className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select size</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-500">201-500 employees</option>
              <option value="500+">500+ employees</option>
            </select>
          ) : (
            <div className="text-gray-900">
              {organization.companySize || "-"}
            </div>
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
              className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
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
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
```

### Acceptance Criteria
- [x] View and edit modes
- [x] Form validation
- [x] Save to API
- [x] Success/error messages
- [x] Loading states
- [x] Responsive layout

### Testing
```bash
1. Navigate to /settings/organization
2. Click "Profile" tab
3. Click "Edit Profile" button
4. Change organization name
5. Click "Save Changes"
6. Verify success message
7. Click "Cancel" to test cancel
```

---

## TASK-018: Create Subscription Info Component

**Priority**: 🟡 Important
**Estimated Time**: 1.5 hours
**Dependencies**: TASK-015
**Files**: `components/organization/SubscriptionInfo.tsx` (NEW)

### Description
Create component to display subscription and billing information.

### Requirements
1. Current plan display
2. Billing cycle information
3. Trial period status
4. Upgrade/downgrade buttons
5. Payment status

### Implementation

**File**: `components/organization/SubscriptionInfo.tsx` (NEW FILE)

```typescript
"use client";

import type { Organization } from "@/types/organization";
import {
  CreditCard,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowUpCircle,
  FileText,
} from "lucide-react";

interface SubscriptionInfoProps {
  organization: Organization;
}

export default function SubscriptionInfo({
  organization,
}: SubscriptionInfoProps) {
  const subscription = organization.subscription;

  if (!subscription) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No subscription information available</p>
      </div>
    );
  }

  const isTrial = organization.status === "TRIAL";
  const isActive = subscription.paymentStatus === "ACTIVE";
  const isPastDue = subscription.paymentStatus === "PAST_DUE";

  const getStatusColor = () => {
    if (isPastDue) return "text-red-600";
    if (isTrial) return "text-blue-600";
    if (isActive) return "text-green-600";
    return "text-gray-600";
  };

  const getStatusIcon = () => {
    if (isPastDue) return <AlertCircle className="h-5 w-5" />;
    if (isTrial) return <Clock className="h-5 w-5" />;
    if (isActive) return <CheckCircle className="h-5 w-5" />;
    return <AlertCircle className="h-5 w-5" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Subscription & Billing
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Manage your subscription and billing details
        </p>
      </div>

      {/* Status Alert */}
      {isTrial && subscription.trialEndDate && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Trial Period Active
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Your trial ends on {formatDate(subscription.trialEndDate)} (
                {getDaysRemaining(subscription.trialEndDate)} days remaining)
              </p>
            </div>
          </div>
        </div>
      )}

      {isPastDue && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">
                Payment Past Due
              </p>
              <p className="text-sm text-red-700 mt-1">
                Please update your payment method to continue using the service.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Plan */}
      <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-2xl font-bold text-gray-900">
              {subscription.planType} Plan
            </h4>
            <div className={`flex items-center gap-2 mt-2 ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="text-sm font-medium">
                {subscription.paymentStatus}
              </span>
            </div>
          </div>
          {subscription.monthlyPrice && (
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                ${subscription.monthlyPrice}
              </div>
              <div className="text-sm text-gray-600">
                / {subscription.billingCycle.toLowerCase()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Billing Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Calendar className="h-5 w-5" />
            <span className="text-sm font-medium">Start Date</span>
          </div>
          <p className="text-gray-900 font-medium">
            {formatDate(subscription.startDate)}
          </p>
        </div>

        {subscription.endDate && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Calendar className="h-5 w-5" />
              <span className="text-sm font-medium">End Date</span>
            </div>
            <p className="text-gray-900 font-medium">
              {formatDate(subscription.endDate)}
            </p>
          </div>
        )}

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <CreditCard className="h-5 w-5" />
            <span className="text-sm font-medium">Billing Cycle</span>
          </div>
          <p className="text-gray-900 font-medium">
            {subscription.billingCycle}
          </p>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <DollarSign className="h-5 w-5" />
            <span className="text-sm font-medium">Payment Status</span>
          </div>
          <p className="text-gray-900 font-medium">
            {subscription.paymentStatus}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
        <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
          <ArrowUpCircle className="h-4 w-4" />
          Upgrade Plan
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
          <CreditCard className="h-4 w-4" />
          Update Payment Method
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
          <FileText className="h-4 w-4" />
          View Invoices
        </button>
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-gray-500 text-center pt-4 border-t">
        Your subscription will automatically renew on{" "}
        {subscription.endDate && formatDate(subscription.endDate)}. You can
        cancel anytime from your account settings.
      </div>
    </div>
  );
}
```

### Acceptance Criteria
- [x] Displays current plan
- [x] Shows billing cycle
- [x] Trial status visible
- [x] Payment status alerts
- [x] Action buttons (upgrade, payment, invoices)
- [x] Responsive layout

### Testing
```bash
1. Navigate to /settings/organization
2. Click "Subscription" tab
3. Verify plan details display
4. Check trial status if applicable
5. Verify action buttons present
```

---

## Phase 3 Complete!

You now have comprehensive organization management features including:
- Full settings page with tabs
- Visual usage monitoring with progress bars
- Organization profile editing
- Subscription and billing information

**Next Step**: Move to [Phase 4: Team & Invitations](./PHASE_4_TEAM_INVITATIONS.md)
