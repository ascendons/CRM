"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { reportsApi, SavedReport } from "@/lib/reports";
import { showToast } from "@/lib/toast";
import { PlusCircle, BarChart2, Table, Trash2 } from "lucide-react";

const CHART_ICONS: Record<string, React.ReactNode> = {
  TABLE: <Table className="w-4 h-4" />,
  BAR: <BarChart2 className="w-4 h-4" />,
  LINE: <BarChart2 className="w-4 h-4" />,
  PIE: <BarChart2 className="w-4 h-4" />,
  FUNNEL: <BarChart2 className="w-4 h-4" />,
};

export default function ReportsPage() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await reportsApi.getAll();
      setReports(data);
    } catch {
      showToast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this report?")) return;
    try {
      await reportsApi.delete(id);
      showToast.success("Report deleted");
      load();
    } catch {
      showToast.error("Failed to delete");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Custom Reports</h1>
        <Link
          href="/reports/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <PlusCircle className="w-4 h-4" /> New Report
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No reports yet. Create your first custom report.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <div
              key={report.reportId}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {CHART_ICONS[report.chartType] || <BarChart2 className="w-4 h-4" />}
                  <Link
                    href={`/reports/${report.reportId}`}
                    className="font-semibold text-gray-900 hover:text-blue-600"
                  >
                    {report.name}
                  </Link>
                </div>
                <button
                  onClick={() => handleDelete(report.reportId)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p>
                  Source: <span className="font-medium">{report.dataSource}</span>
                </p>
                <p>
                  Chart: <span className="font-medium">{report.chartType}</span>
                </p>
                {report.isScheduled && (
                  <span className="inline-block bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Scheduled
                  </span>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/reports/${report.reportId}`}
                  className="flex-1 text-center text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg"
                >
                  View
                </Link>
                <Link
                  href={`/reports/${report.reportId}`}
                  className="flex-1 text-center text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg"
                >
                  Run
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
