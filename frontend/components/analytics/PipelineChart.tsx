"use client";

import { useState, useEffect } from "react";
import { analyticsApi } from "@/lib/api/analytics";
import type { OpportunityStatistics } from "@/types/opportunity";
import { OpportunityStage } from "@/types/opportunity";
import {
  BarChart3,
  Loader2,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";

interface PipelineChartProps {
  refreshKey?: number;
}

interface StageData {
  name: string;
  count: number;
  value: number;
  color: string;
  bgColor: string;
  icon: typeof ArrowUp;
}

export function PipelineChart({ refreshKey }: PipelineChartProps) {
  const [stats, setStats] = useState<OpportunityStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [refreshKey]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const data = await analyticsApi.getOpportunityStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load pipeline stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-6 w-6 bg-slate-200 rounded animate-pulse"></div>
          <div className="h-5 w-32 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
              <div className="flex-1 h-6 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 w-12 bg-slate-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const stageOrder: { stage: OpportunityStage; label: string; color: string; bgColor: string; icon: typeof ArrowUp }[] = [
    { stage: OpportunityStage.PROSPECTING, label: "Prospecting", color: "text-blue-600", bgColor: "bg-blue-500", icon: ArrowUp },
    { stage: OpportunityStage.QUALIFICATION, label: "Qualification", color: "text-cyan-600", bgColor: "bg-cyan-500", icon: ArrowUp },
    { stage: OpportunityStage.NEEDS_ANALYSIS, label: "Needs Analysis", color: "text-teal-600", bgColor: "bg-teal-500", icon: ArrowUp },
    { stage: OpportunityStage.PROPOSAL, label: "Proposal", color: "text-purple-600", bgColor: "bg-purple-500", icon: ArrowUp },
    { stage: OpportunityStage.NEGOTIATION, label: "Negotiation", color: "text-orange-600", bgColor: "bg-orange-500", icon: ArrowUp },
    { stage: OpportunityStage.CLOSED_WON, label: "Closed Won", color: "text-emerald-600", bgColor: "bg-emerald-500", icon: ArrowUp },
  ];

  const stageData: StageData[] = stageOrder.map(({ stage, label, color, bgColor, icon }) => {
    let count = 0;
    switch (stage) {
      case OpportunityStage.PROSPECTING:
        count = stats.prospectingCount;
        break;
      case OpportunityStage.QUALIFICATION:
        count = stats.qualificationCount;
        break;
      case OpportunityStage.NEEDS_ANALYSIS:
        count = stats.needsAnalysisCount;
        break;
      case OpportunityStage.PROPOSAL:
        count = stats.proposalCount;
        break;
      case OpportunityStage.NEGOTIATION:
        count = stats.negotiationCount;
        break;
      case OpportunityStage.CLOSED_WON:
        count = stats.wonCount;
        break;
    }
    return { name: label, count, value: count, color, bgColor, icon };
  });

  const lostData = {
    name: "Closed Lost",
    count: stats.lostCount,
    value: stats.lostCount,
    color: "text-rose-600",
    bgColor: "bg-rose-500",
    icon: ArrowDown,
  };

  const allData = [...stageData, lostData];
  const maxCount = Math.max(...allData.map((d) => d.count), 1);

  const formatCurrency = (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(1)}Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${value}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Pipeline Overview</h3>
          <p className="text-sm text-slate-500">Opportunities by stage</p>
        </div>
      </div>

      {/* Stage Bars */}
      <div className="space-y-3">
        {allData.map((stage) => {
          const Icon = stage.icon;
          const percentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;

          return (
            <div key={stage.name} className="flex items-center gap-3">
              <div className="w-28 flex items-center gap-1.5">
                <Icon className={`h-4 w-4 ${stage.color}`} />
                <span className="text-xs font-medium text-slate-700 truncate">{stage.name}</span>
              </div>
              <div className="flex-1 bg-slate-100 rounded-full h-6 relative overflow-hidden">
                <div
                  className={`h-6 rounded-full transition-all duration-500 ${stage.bgColor}`}
                  style={{ width: `${Math.max(percentage, stage.count > 0 ? 5 : 0)}%` }}
                />
                {stage.count > 0 && (
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-sm">
                    {stage.count}
                  </span>
                )}
              </div>
              <div className="w-16 text-right">
                <span className="text-sm font-semibold text-slate-900">
                  {stage.count > 0 ? stage.count : "-"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-500 mb-1">Open Pipeline</p>
          <p className="text-lg font-bold text-slate-900">{stats.openOpportunities} deals</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Pipeline Value</p>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(stats.pipelineValue)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Won Value</p>
          <p className="text-lg font-bold text-emerald-600">{formatCurrency(stats.wonValue)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Weighted Value</p>
          <p className="text-lg font-bold text-purple-600">{formatCurrency(stats.weightedValue)}</p>
        </div>
      </div>
    </div>
  );
}
