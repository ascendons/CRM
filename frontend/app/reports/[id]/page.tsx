"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { reportsApi, SavedReport } from "@/lib/reports";
import { showToast } from "@/lib/toast";
import { Play, BarChart2 } from "lucide-react";

export default function ReportViewerPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<SavedReport | null>(null);
  const [results, setResults] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await reportsApi.getById(id);
      setReport(data);
    } catch {
      showToast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const runReport = async () => {
    try {
      setRunning(true);
      const data = await reportsApi.run(id);
      setResults(data);
      showToast.success(`${data.length} rows returned`);
    } catch {
      showToast.error("Failed to run report");
    } finally {
      setRunning(false);
    }
  };

  const maxVal =
    results.length > 0
      ? Math.max(...results.map((r) => (typeof r.count === "number" ? r.count : 0)), 1)
      : 1;

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!report) return <div className="p-8 text-center text-red-500">Report not found</div>;

  const columns = results.length > 0 ? Object.keys(results[0]) : report.columns || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{report.name}</h1>
          <p className="text-sm text-gray-500">
            {report.dataSource} · {report.chartType}
          </p>
        </div>
        <button
          onClick={runReport}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          <Play className="w-4 h-4" /> {running ? "Running..." : "Run Report"}
        </button>
      </div>

      {results.length > 0 && report.chartType === "BAR" && report.groupBy && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Chart</h2>
          <div className="space-y-3">
            {results.slice(0, 20).map((row, i) => {
              const label = row["_id"] ?? row[report.groupBy] ?? `Row ${i + 1}`;
              const val = typeof row.count === "number" ? row.count : 0;
              const pct = Math.round((val / maxVal) * 100);
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-32 truncate">{String(label)}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5">
                    <div
                      className="bg-blue-500 h-5 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${pct}%` }}
                    >
                      <span className="text-xs text-white font-medium">{val}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {results.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {columns.map((col) => (
                      <td key={col} className="px-4 py-3 text-gray-700">
                        {String(row[col] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Click "Run Report" to see results</p>
        </div>
      )}
    </div>
  );
}
