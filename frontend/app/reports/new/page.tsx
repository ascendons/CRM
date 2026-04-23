"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reportsApi, ReportDataSource, ReportChartType, ReportFilter } from "@/lib/reports";
import { showToast } from "@/lib/toast";
import { Plus, X } from "lucide-react";

const DATA_SOURCES: ReportDataSource[] = [
  "LEADS",
  "OPPORTUNITIES",
  "WORK_ORDERS",
  "ATTENDANCE",
  "INVOICES",
  "ACTIVITIES",
];
const CHART_TYPES: ReportChartType[] = ["TABLE", "BAR", "LINE", "PIE", "FUNNEL"];
const OPERATORS = ["eq", "ne", "contains"];

const SOURCE_FIELDS: Record<ReportDataSource, string[]> = {
  LEADS: ["leadStatus", "leadSource", "industry", "country", "assignedUserId"],
  OPPORTUNITIES: ["stage", "leadSource", "assignedUserId", "currency"],
  WORK_ORDERS: ["status", "priority", "assignedTechnicianId"],
  ATTENDANCE: ["status", "userId", "date"],
  INVOICES: ["status", "contactId"],
  ACTIVITIES: ["type", "status", "assignedUserId"],
};

export default function NewReportPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [dataSource, setDataSource] = useState<ReportDataSource>("LEADS");
  const [chartType, setChartType] = useState<ReportChartType>("TABLE");
  const [groupBy, setGroupBy] = useState("");
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [saving, setSaving] = useState(false);

  const addFilter = () => setFilters([...filters, { field: "", operator: "eq", value: "" }]);
  const removeFilter = (i: number) => setFilters(filters.filter((_, idx) => idx !== i));
  const updateFilter = (i: number, key: keyof ReportFilter, val: string) => {
    setFilters(filters.map((f, idx) => (idx === i ? { ...f, [key]: val } : f)));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast.error("Report name is required");
      return;
    }
    try {
      setSaving(true);
      const report = await reportsApi.create({
        name,
        dataSource,
        chartType,
        groupBy,
        filters: filters.filter((f) => f.field && f.value),
        columns: SOURCE_FIELDS[dataSource],
      });
      showToast.success("Report created");
      router.push(`/reports/${report.reportId}`);
    } catch {
      showToast.error("Failed to create report");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Report</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Report Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Monthly Leads by Source"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Source</label>
            <select
              value={dataSource}
              onChange={(e) => setDataSource(e.target.value as ReportDataSource)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DATA_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chart Type</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ReportChartType)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CHART_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Group By (optional)
          </label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">None</option>
            {SOURCE_FIELDS[dataSource].map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Filters</label>
            <button
              onClick={addFilter}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-3 h-3" /> Add Filter
            </button>
          </div>
          {filters.map((f, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <select
                value={f.field}
                onChange={(e) => updateFilter(i, "field", e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs"
              >
                <option value="">Field</option>
                {SOURCE_FIELDS[dataSource].map((field) => (
                  <option key={field} value={field}>
                    {field}
                  </option>
                ))}
              </select>
              <select
                value={f.operator}
                onChange={(e) => updateFilter(i, "operator", e.target.value)}
                className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-xs"
              >
                {OPERATORS.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
              <input
                value={f.value}
                onChange={(e) => updateFilter(i, "value", e.target.value)}
                placeholder="value"
                className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs"
              />
              <button onClick={() => removeFilter(i)} className="text-gray-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Report"}
          </button>
        </div>
      </div>
    </div>
  );
}
