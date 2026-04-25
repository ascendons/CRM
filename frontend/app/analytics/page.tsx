"use client";

import { useState, useEffect } from "react";
import DashboardStats from "@/components/analytics/DashboardStats";
import GrowthTrends from "@/components/analytics/GrowthTrends";
import { PipelineChart } from "@/components/analytics/PipelineChart";
import { RecentActivityTimeline } from "@/components/analytics/RecentActivityTimeline";
import { formatLocaleIST } from "@/lib/utils/date";
import { analyticsApi } from "@/lib/api/analytics";
import {
  BarChart3,
  TrendingUp,
  Download,
  RefreshCw,
  Calendar,
  DollarSign,
  Target,
  Loader2,
} from "lucide-react";

export default function AnalyticsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<{
    totalRevenue: number;
    winRate: number;
    averageDealSize: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadStats();
  }, [refreshKey]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [dashStats, oppStats] = await Promise.all([
        analyticsApi.getDashboardStats(),
        analyticsApi.getOpportunityStats(),
      ]);

      setStats({
        totalRevenue: oppStats.wonValue || 0,
        winRate: oppStats.winRate || 0,
        averageDealSize: oppStats.averageDealSize || 0,
      });
    } catch (err) {
      console.error("Failed to load analytics stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const dashStats = await analyticsApi.getDashboardStats();
      const growthTrends = await analyticsApi.getGrowthTrends(30);

      const csvContent = [
        ["Metric", "Value"],
        ["Total Leads", dashStats.totalLeads],
        ["Total Contacts", dashStats.totalContacts],
        ["Total Opportunities", dashStats.totalOpportunities],
        ["Total Activities", dashStats.totalActivities],
        ["", ""],
        ["Growth Trends (30 days)", ""],
        ["Lead Growth", growthTrends.leadGrowth],
        ["Contact Growth", growthTrends.contactGrowth],
        ["Opportunity Growth", growthTrends.opportunityGrowth],
        ["", ""],
        ["Revenue Analytics", ""],
        ["Total Revenue", stats?.totalRevenue || 0],
        ["Win Rate", `${stats?.winRate || 0}%`],
        ["Average Deal Size", stats?.averageDealSize || 0],
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                <BarChart3 className="h-7 w-7 text-primary" />
                Analytics Dashboard
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Track your organization&apos;s performance and growth
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-xl transition-colors shadow-lg shadow-primary/25 disabled:opacity-50"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Key Metrics */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Key Metrics
          </h2>
          <DashboardStats refreshKey={refreshKey} />
        </section>

        {/* Revenue & Win Rate Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-slate-900">
                  {loading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  ) : (
                    new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                      maximumFractionDigits: 0,
                    }).format(stats?.totalRevenue || 0)
                  )}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm text-emerald-600">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">From won deals</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Win Rate</p>
                <p className="text-3xl font-bold text-slate-900">
                  {loading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  ) : (
                    `${(stats?.winRate || 0).toFixed(1)}%`
                  )}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm text-slate-600">
              <span className="font-medium">Closed Won / Total Closed</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Avg. Deal Size</p>
                <p className="text-3xl font-bold text-slate-900">
                  {loading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  ) : (
                    new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                      maximumFractionDigits: 0,
                    }).format(stats?.averageDealSize || 0)
                  )}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm text-slate-600">
              <span className="font-medium">Average opportunity value</span>
            </div>
          </div>
        </section>

        {/* Growth Trends */}
        <section>
          <GrowthTrends refreshKey={refreshKey} />
        </section>

        {/* Pipeline & Recent Activity */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PipelineChart refreshKey={refreshKey} />
          <RecentActivityTimeline refreshKey={refreshKey} />
        </section>

        {/* Last Updated */}
        <div className="text-center text-xs text-slate-400">
          Last updated: {formatLocaleIST(new Date())}
        </div>
      </main>
    </div>
  );
}
