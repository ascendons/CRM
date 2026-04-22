"use client";

import Link from "next/link";
import { Umbrella, CalendarDays, ArrowUpRight, AlertCircle } from "lucide-react";

interface LeaveSummaryCardProps {
  leaveBalance: any;
  loading: boolean;
}

export function LeaveSummaryCard({ leaveBalance, loading }: LeaveSummaryCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 bg-slate-100 rounded"></div>
            <div className="h-20 bg-slate-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const topLeaveTypes = leaveBalance?.balances
    ? Object.entries(leaveBalance.balances)
        .slice(0, 2)
        .map(([type, balance]: [string, any]) => ({
          type: type
            .replace(/_/g, " ")
            .toLowerCase()
            .replace(/\b\w/g, (l: string) => l.toUpperCase()),
          available: balance.available,
          total: balance.total,
          used: balance.used,
        }))
    : [];

  const totalAvailable = leaveBalance?.balances
    ? Object.values(leaveBalance.balances).reduce((sum: number, b: any) => sum + b.available, 0)
    : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Umbrella className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Leave Balance</h3>
              <p className="text-xs text-slate-500">{totalAvailable} days available</p>
            </div>
          </div>
          <Link
            href="/leaves"
            className="text-primary hover:text-primary-hover transition-colors flex items-center gap-1 text-sm font-semibold"
          >
            View All
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Leave Balance Summary */}
        {topLeaveTypes.length > 0 ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {topLeaveTypes.map((leave) => (
                <div
                  key={leave.type}
                  className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-3 border border-teal-100"
                >
                  <p className="text-xs text-teal-600 font-medium mb-2">{leave.type}</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-2xl font-bold text-slate-900">{leave.available}</p>
                    <p className="text-xs text-slate-500">/ {leave.total}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{leave.used} used</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Link
                href="/leaves/new"
                className="flex-1 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-semibold text-sm hover:from-teal-700 hover:to-cyan-700 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <CalendarDays className="h-4 w-4" />
                Apply Leave
              </Link>
              <Link
                href="/leaves/balance"
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all"
              >
                Details
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500 mb-3">No leave balance data</p>
            <Link
              href="/leaves"
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-all"
            >
              <CalendarDays className="h-4 w-4" />
              View Leaves
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
