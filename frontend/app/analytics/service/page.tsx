"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import { showToast } from "@/lib/toast";

interface ServiceKpis {
  mttrHours: number;
  firstTimeFixRatePct: number;
  slaComplianceRatePct: number;
  repeatVisitRatePct: number;
  totalOpenWOs: number;
  totalCompletedWOs: number;
  openWOAgingBuckets: Record<string, number>;
  engineerProductivity: Record<string, number>;
}

interface ServiceVolume {
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
}

interface PartsAvailability {
  totalPartsRequests: number;
  sameDayFulfilledCount: number;
  partsAvailabilityRatePct: number;
}

interface KpiCardProps {
  label: string;
  value: string;
  icon: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
}

function KpiCard({ label, value, icon, borderColor, iconBg, iconColor }: KpiCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${borderColor} flex items-center gap-4`}>
      <div className={`${iconBg} p-3 rounded-lg`}>
        <span className={`material-symbols-outlined ${iconColor} text-2xl`}>{icon}</span>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-16 shrink-0">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-3">
        <div
          className={`${color} h-3 rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-700 w-8 text-right">{value}</span>
    </div>
  );
}

function StatGroup({ title, data, colorClass }: { title: string; data: Record<string, number>; colorClass: string }) {
  const max = Math.max(...Object.values(data), 1);
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      <div className="space-y-3">
        {Object.entries(data).map(([key, val]) => (
          <BarRow key={key} label={key} value={val} max={max} color={colorClass} />
        ))}
      </div>
    </div>
  );
}

export default function ServiceAnalyticsPage() {
  const [kpis, setKpis] = useState<ServiceKpis | null>(null);
  const [volume, setVolume] = useState<ServiceVolume | null>(null);
  const [parts, setParts] = useState<PartsAvailability | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [kpisRes, volumeRes, partsRes] = await Promise.all([
        api.get<ServiceKpis>("/analytics/service/kpis"),
        api.get<ServiceVolume>("/analytics/service/volume"),
        api.get<PartsAvailability>("/analytics/service/parts-availability"),
      ]);
      setKpis(kpisRes);
      setVolume(volumeRes);
      setParts(partsRes);
    } catch {
      showToast.error("Failed to load service analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const agingBuckets = kpis?.openWOAgingBuckets
    ? [
        { label: "0-4h", key: "0-4h", color: "bg-green-500" },
        { label: "4-8h", key: "4-8h", color: "bg-yellow-500" },
        { label: "8-24h", key: "8-24h", color: "bg-orange-500" },
        { label: "24h+", key: "24h+", color: "bg-red-500" },
      ]
    : [];
  const agingMax = kpis
    ? Math.max(...agingBuckets.map((b) => kpis.openWOAgingBuckets[b.key] ?? 0), 1)
    : 1;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Service Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time field service performance metrics</p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <span className={`material-symbols-outlined text-base ${loading ? "animate-spin" : ""}`}>refresh</span>
          Refresh
        </button>
      </div>

      {loading && !kpis ? (
        <div className="flex items-center justify-center h-64">
          <span className="material-symbols-outlined animate-spin text-4xl text-blue-500">progress_activity</span>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <KpiCard
              label="MTTR"
              value={`${kpis?.mttrHours?.toFixed(1) ?? "—"}h`}
              icon="timer"
              borderColor="border-blue-500"
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />
            <KpiCard
              label="First Time Fix Rate"
              value={`${kpis?.firstTimeFixRatePct?.toFixed(1) ?? "—"}%`}
              icon="task_alt"
              borderColor="border-green-500"
              iconBg="bg-green-50"
              iconColor="text-green-600"
            />
            <KpiCard
              label="SLA Compliance"
              value={`${kpis?.slaComplianceRatePct?.toFixed(1) ?? "—"}%`}
              icon="verified"
              borderColor="border-purple-500"
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
            />
            <KpiCard
              label="Repeat Visit Rate"
              value={`${kpis?.repeatVisitRatePct?.toFixed(1) ?? "—"}%`}
              icon="repeat"
              borderColor="border-orange-500"
              iconBg="bg-orange-50"
              iconColor="text-orange-600"
            />
            <KpiCard
              label="Open Work Orders"
              value={String(kpis?.totalOpenWOs ?? "—")}
              icon="pending_actions"
              borderColor="border-red-500"
              iconBg="bg-red-50"
              iconColor="text-red-600"
            />
            <KpiCard
              label="Completed Work Orders"
              value={String(kpis?.totalCompletedWOs ?? "—")}
              icon="check_circle"
              borderColor="border-emerald-500"
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
            />
          </div>

          {/* WO Aging Buckets */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-500">hourglass_top</span>
              Open WO Aging Buckets
            </h2>
            <div className="space-y-4">
              {agingBuckets.map((b) => {
                const val = kpis?.openWOAgingBuckets[b.key] ?? 0;
                return (
                  <BarRow key={b.key} label={b.label} value={val} max={agingMax} color={b.color} />
                );
              })}
            </div>
          </div>

          {/* Volume Stats */}
          {volume && (
            <div>
              <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500">bar_chart</span>
                Work Order Volume
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatGroup title="By Type" data={volume.byType} colorClass="bg-blue-500" />
                <StatGroup title="By Priority" data={volume.byPriority} colorClass="bg-purple-500" />
                <StatGroup title="By Status" data={volume.byStatus} colorClass="bg-slate-500" />
              </div>
            </div>
          )}

          {/* Parts Availability + Engineer Productivity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Parts Availability */}
            {parts && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-teal-500">category</span>
                  Parts Availability
                </h2>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{parts.totalPartsRequests}</p>
                    <p className="text-xs text-slate-500 mt-1">Total Requests</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{parts.sameDayFulfilledCount}</p>
                    <p className="text-xs text-slate-500 mt-1">Same-Day Fulfilled</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-blue-600">{parts.partsAvailabilityRatePct.toFixed(1)}%</p>
                    <p className="text-xs text-slate-500 mt-1">Availability Rate</p>
                  </div>
                </div>
                <div className="mt-4 bg-slate-100 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full"
                    style={{ width: `${Math.min(parts.partsAvailabilityRatePct, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Engineer Productivity */}
            {kpis?.engineerProductivity && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-500">engineering</span>
                  Engineer Productivity
                </h2>
                <div className="overflow-auto max-h-48">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase pb-2">Engineer ID</th>
                        <th className="text-right text-xs font-semibold text-slate-500 uppercase pb-2">WOs Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(kpis.engineerProductivity)
                        .sort(([, a], [, b]) => b - a)
                        .map(([engId, count]) => (
                          <tr key={engId} className="border-b border-slate-50 last:border-0">
                            <td className="py-2 text-slate-700 font-mono text-xs">{engId}</td>
                            <td className="py-2 text-right font-semibold text-slate-800">{count}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {Object.keys(kpis.engineerProductivity).length === 0 && (
                    <p className="text-center text-slate-400 text-sm py-4">No data available</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
