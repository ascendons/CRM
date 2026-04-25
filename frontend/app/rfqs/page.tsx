"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { procurementService, TradingRFQ, TradingRfqStatus } from "@/lib/procurement";
import { showToast } from "@/lib/toast";
import {
  Loader2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Send,
  Filter,
} from "lucide-react";

const statusConfig: Record<TradingRfqStatus, { color: string; label: string }> = {
  DRAFT: { color: "bg-gray-100 text-gray-700", label: "Draft" },
  SENT: { color: "bg-blue-100 text-blue-700", label: "Sent" },
  RESPONSE_RECEIVED: { color: "bg-yellow-100 text-yellow-700", label: "Response Received" },
  ACCEPTED: { color: "bg-green-100 text-green-700", label: "Accepted" },
  CLOSED: { color: "bg-purple-100 text-purple-700", label: "Closed" },
  CANCELLED: { color: "bg-red-100 text-red-700", label: "Cancelled" },
};

const ALL_STATUSES: TradingRfqStatus[] = [
  "DRAFT",
  "SENT",
  "RESPONSE_RECEIVED",
  "ACCEPTED",
  "CLOSED",
  "CANCELLED",
];

export default function RfqListPage() {
  const [rfqs, setRfqs] = useState<TradingRFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TradingRfqStatus | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const data = await procurementService.getTradingRfqs(undefined);
      setRfqs(data);
    } catch {
      showToast.error("Failed to load RFQs");
    } finally {
      setLoading(false);
    }
  }

  const filtered = rfqs.filter((r) => {
    const matchSearch =
      !search ||
      r.rfqId.toLowerCase().includes(search.toLowerCase()) ||
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.sourceReferenceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      r.vendorNames.some((v) => v.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Requests for Quotation</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} total RFQ{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4 px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by RFQ ID, title, source, vendor..."
            className="flex-1 border-0 text-sm focus:outline-none placeholder-gray-400"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => {
              setStatusFilter("ALL");
              setPage(0);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === "ALL"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(0);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? `${statusConfig[s].color} ring-1 ring-offset-1 ring-gray-400`
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {statusConfig[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            {search || statusFilter !== "ALL"
              ? "No RFQs match your filters"
              : "No RFQs yet. Create one from a Sales Proposal."}
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">RFQ ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Vendors</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">Items</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">
                    Responses
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                    Deadline
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((rfq) => {
                  const sc = statusConfig[rfq.status] ?? {
                    color: "bg-gray-100",
                    label: rfq.status,
                  };
                  return (
                    <tr
                      key={rfq.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => (window.location.href = `/rfqs/${rfq.id}`)}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/rfqs/${rfq.id}`}
                          className="font-medium text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {rfq.rfqId}
                        </Link>
                        {rfq.title && (
                          <p className="text-xs text-gray-500 truncate max-w-[150px]">
                            {rfq.title}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {rfq.sourceReferenceNumber ? (
                          <Link
                            href={`/proposals/${rfq.sourceId}`}
                            className="text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {rfq.sourceReferenceNumber}
                          </Link>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-[150px]">
                        <span className="truncate block">{rfq.vendorNames.join(", ") || "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-700">
                        {rfq.items.length}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {rfq.responses.length > 0 ? (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-xs font-medium">
                            {rfq.responses.length}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${sc.color}`}
                        >
                          {sc.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
                <span className="text-xs text-gray-500">
                  Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)}{" "}
                  of {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`w-7 h-7 rounded text-xs font-medium ${
                        page === i ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
