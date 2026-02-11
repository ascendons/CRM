# Phase 5: Analytics Dashboard (Important)

## Overview

**Duration**: 3 days
**Tasks**: 5 (TASK-024 to TASK-028)
**Priority**: 🟡 Important
**Dependencies**: Phase 1 complete

This phase implements analytics and dashboard features based on the TenantAnalyticsService. It provides comprehensive insights into organization data with visual dashboards and trend analysis.

---

## What You'll Build

1. ✅ Analytics API client
2. ✅ Dashboard Stats Component with metrics cards
3. ✅ Growth Trends Component with charts
4. ✅ Dedicated Analytics Page
5. ✅ Dashboard integration with quick stats

---

## Success Criteria

By the end of Phase 5, you will have:
- [x] Real-time dashboard statistics
- [x] Visual growth trend charts
- [x] Comprehensive analytics page
- [x] Performance metrics tracking
- [x] Professional data visualization

---

## Task List

- [TASK-024](#task-024-create-analytics-api) - Analytics API (30 min)
- [TASK-025](#task-025-create-dashboard-stats-component) - Stats Component (1.5 hours)
- [TASK-026](#task-026-create-growth-trends-component) - Trends Component (2 hours)
- [TASK-027](#task-027-create-analytics-page) - Analytics Page (1.5 hours)
- [TASK-028](#task-028-update-dashboard-with-analytics) - Dashboard Integration (45 min)

**Total Time**: ~6.5 hours actual coding + testing

---

## TASK-024: Create Analytics API

**Priority**: 🟡 Important
**Estimated Time**: 30 minutes
**Dependencies**: None
**Files**: `lib/api/analytics.ts` (NEW)

### Description
Create API client methods for analytics endpoints based on TenantAnalyticsService.

### Requirements
1. Get dashboard stats
2. Get growth trends
3. Type-safe responses
4. Error handling

### Implementation

**File**: `lib/api/analytics.ts` (NEW FILE)

```typescript
import { api } from '../api-client';
import type { DashboardStats, GrowthTrends } from '@/types/organization';

export const analyticsApi = {
  /**
   * Get comprehensive dashboard statistics
   * Requires authentication
   */
  async getDashboardStats(): Promise<DashboardStats> {
    return api.get<DashboardStats>('/analytics/dashboard-stats');
  },

  /**
   * Get growth trends over specified period
   * Requires authentication
   * @param days - Number of days to analyze (default: 30)
   */
  async getGrowthTrends(days: number = 30): Promise<GrowthTrends> {
    return api.get<GrowthTrends>(`/analytics/growth-trends?days=${days}`);
  },
};
```

### Acceptance Criteria
- [x] All API methods defined
- [x] Type-safe with proper interfaces
- [x] Uses centralized API client
- [x] Error handling included
- [x] JSDoc comments added

### Testing
```typescript
// Test in React component
import { analyticsApi } from '@/lib/api/analytics';

// Get dashboard stats
const stats = await analyticsApi.getDashboardStats();
console.log(stats); // { totalLeads: 150, totalContacts: 320, ... }

// Get growth trends
const trends = await analyticsApi.getGrowthTrends(30);
console.log(trends); // { period: "30 days", leadGrowth: 25, ... }
```

---

## TASK-025: Create Dashboard Stats Component

**Priority**: 🟡 Important
**Estimated Time**: 1.5 hours
**Dependencies**: TASK-024
**Files**: `components/analytics/DashboardStats.tsx` (NEW)

### Description
Create component to display key metrics in cards format.

### Requirements
1. Fetch dashboard statistics
2. Display in metric cards
3. Icons for each metric
4. Loading states
5. Responsive grid layout

### Implementation

**File**: `components/analytics/DashboardStats.tsx` (NEW FILE)

```typescript
"use client";

import { useState, useEffect } from "react";
import { analyticsApi } from "@/lib/api/analytics";
import type { DashboardStats as DashboardStatsType } from "@/types/organization";
import {
  Users,
  UserPlus,
  Building,
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
      color: "blue",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Total Contacts",
      value: stats.totalContacts,
      icon: Users,
      color: "green",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      label: "Total Opportunities",
      value: stats.totalOpportunities,
      icon: DollarSign,
      color: "purple",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      label: "Total Activities",
      value: stats.totalActivities,
      icon: Activity,
      color: "orange",
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

            {/* Optional: Add growth indicator */}
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
```

### Acceptance Criteria
- [x] Displays all metrics
- [x] Color-coded cards
- [x] Icons for each metric
- [x] Loading states
- [x] Error handling
- [x] Responsive grid

### Testing
```bash
1. Add component to dashboard
2. Verify metrics load
3. Check responsive layout
4. Test loading state
5. Verify error handling
```

---

## TASK-026: Create Growth Trends Component

**Priority**: 🟡 Important
**Estimated Time**: 2 hours
**Dependencies**: TASK-024
**Files**: `components/analytics/GrowthTrends.tsx` (NEW)

### Description
Create component to visualize growth trends with simple bar charts.

### Requirements
1. Fetch growth trend data
2. Display as bar chart (CSS-based)
3. Period selector (7, 30, 90 days)
4. Color-coded growth
5. Responsive layout

### Implementation

**File**: `components/analytics/GrowthTrends.tsx` (NEW FILE)

```typescript
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
  Calendar,
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
    {
      label: "Leads",
      value: trends.leadGrowth,
      icon: UserPlus,
      color: "blue",
    },
    {
      label: "Contacts",
      value: trends.contactGrowth,
      icon: Users,
      color: "green",
    },
    {
      label: "Opportunities",
      value: trends.opportunityGrowth,
      icon: DollarSign,
      color: "purple",
    },
  ];

  const maxValue = Math.max(
    trends.leadGrowth,
    trends.contactGrowth,
    trends.opportunityGrowth,
    1
  );

  const getBarColor = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-500";
      case "green":
        return "bg-green-500";
      case "purple":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case "blue":
        return "text-blue-600";
      case "green":
        return "text-green-600";
      case "purple":
        return "text-purple-600";
      default:
        return "text-gray-600";
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
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                period === days
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
              {/* Label & Value */}
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

              {/* Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${getBarColor(
                    item.color
                  )}`}
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
```

### Acceptance Criteria
- [x] Displays growth trends
- [x] Visual bar charts
- [x] Period selector works
- [x] Color-coded bars
- [x] Loading states
- [x] Responsive layout

### Testing
```bash
1. Add component to analytics page
2. Verify bars render correctly
3. Test period selector (7d, 30d, 90d)
4. Check responsive layout
5. Verify calculations
```

---

## TASK-027: Create Analytics Page

**Priority**: 🟡 Important
**Estimated Time**: 1.5 hours
**Dependencies**: TASK-025, TASK-026
**Files**: `app/analytics/page.tsx` (NEW)

### Description
Create dedicated analytics page with comprehensive data views.

### Requirements
1. Dashboard stats overview
2. Growth trends visualization
3. Additional metrics sections
4. Refresh functionality
5. Export data option (future)

### Implementation

**File**: `app/analytics/page.tsx` (NEW FILE)

```typescript
"use client";

import { useState } from "react";
import DashboardStats from "@/components/analytics/DashboardStats";
import GrowthTrends from "@/components/analytics/GrowthTrends";
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
              Track your organization's performance and growth
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
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
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}
```

### Acceptance Criteria
- [x] Complete analytics layout
- [x] Stats and trends display
- [x] Refresh functionality
- [x] Export button (placeholder)
- [x] Responsive design
- [x] Professional appearance

### Testing
```bash
1. Navigate to /analytics
2. Verify all components load
3. Test refresh button
4. Check responsive layout
5. Verify data accuracy
```

---

## TASK-028: Update Dashboard with Analytics

**Priority**: 🟡 Important
**Estimated Time**: 45 minutes
**Dependencies**: TASK-025
**Files**: `app/dashboard/page.tsx` (UPDATE)

### Description
Update the main dashboard page to include quick analytics overview.

### Requirements
1. Add DashboardStats component
2. Add link to full analytics page
3. Quick insights section
4. Clean integration

### Implementation

**File**: `app/dashboard/page.tsx` (UPDATE)

Add these imports at the top:

```typescript
import DashboardStats from "@/components/analytics/DashboardStats";
import { BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";
```

Add this section after the welcome message and before existing content:

```typescript
{/* Analytics Overview */}
<div className="mb-8">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
      <BarChart3 className="h-6 w-6 text-blue-600" />
      Quick Analytics
    </h2>
    <Link
      href="/analytics"
      className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
    >
      View Full Analytics
      <ArrowRight className="h-4 w-4" />
    </Link>
  </div>
  <DashboardStats />
</div>
```

Complete example of updated dashboard page:

```typescript
"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/lib/hooks/useTenant";
import DashboardStats from "@/components/analytics/DashboardStats";
import { BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { organizationName, isLoaded } = useTenant();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Message */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome to {organizationName || "Your"} CRM
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your business today
        </p>
      </div>

      {/* Analytics Overview */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Quick Analytics
          </h2>
          <Link
            href="/analytics"
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View Full Analytics
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <DashboardStats />
      </div>

      {/* Existing dashboard content */}
      {/* Add your existing dashboard sections here */}
    </div>
  );
}
```

### Acceptance Criteria
- [x] Stats display on dashboard
- [x] Link to full analytics page
- [x] Clean integration
- [x] No layout conflicts
- [x] Responsive design

### Testing
```bash
1. Navigate to /dashboard
2. See analytics stats cards
3. Click "View Full Analytics"
4. Should navigate to /analytics
5. Verify responsive layout
```

---

## Phase 5 Complete!

You now have comprehensive analytics and reporting features including:
- Real-time dashboard statistics
- Visual growth trend analysis
- Dedicated analytics page
- Dashboard integration with quick stats
- Professional data visualization

**Next Step**: Move to [Phase 6: Polish & Testing](./PHASE_6_POLISH_TESTING.md)
