"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { procurementService, TradingPurchaseOrder, TradingPoStatus } from "@/lib/procurement";
import { showToast } from "@/lib/toast";
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  Package,
  XCircle,
  Send,
} from "lucide-react";

const statusConfig: Record<TradingPoStatus, { color: string; label: string }> = {
  DRAFT: { color: "bg-gray-100 text-gray-700", label: "Draft" },
  SUBMITTED: { color: "bg-yellow-100 text-yellow-700", label: "Awaiting Approval" },
  APPROVED: { color: "bg-blue-100 text-blue-700", label: "Approved" },
  SENT: { color: "bg-indigo-100 text-indigo-700", label: "Sent to Supplier" },
  RECEIVING: { color: "bg-orange-100 text-orange-700", label: "In Receiving" },
  RECEIVED: { color: "bg-green-100 text-green-700", label: "Received" },
  CANCELLED: { color: "bg-red-100 text-red-700", label: "Cancelled" },
  CLOSED: { color: "bg-purple-100 text-purple-700", label: "Closed" },
};

const ALL_STATUSES: TradingPoStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "SENT",
  "RECEIVING",
  "RECEIVED",
  "CANCELLED",
  "CLOSED",
];

export default function PoListPage() {
  const [pos, setPos] = useState<TradingPurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TradingPoStatus | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const data = await procurementService.getTradingPos();
      setPos(data);
    } catch {
      showToast.error("Failed to load Purchase Orders");
    } finally {
      setLoading(false);
    }
  }

  const filtered = pos.filter((p) => {
    const matchSearch =
      !search ||
      p.tradingPoId.toLowerCase().includes(search.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      p.sourceReferenceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      p.rfqReferenceNumber?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} total PO{filtered.length !== 1 ? "s" : ""}
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
            placeholder="Search by PO number, supplier, source..."
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
              ? "No Purchase Orders match your filters"
              : "No POs yet. Convert an accepted RFQ to create a PO."}
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                    PO Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                    Supplier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Source</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">Items</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">
                    Total Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                    Order Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                    Expected Delivery
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((po) => {
                  const sc = statusConfig[po.status] ?? { color: "bg-gray-100", label: po.status };
                  return (
                    <tr
                      key={po.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => (window.location.href = `/purchase-orders/${po.id}`)}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/purchase-orders/${po.id}`}
                          className="font-medium text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {po.tradingPoId}
                        </Link>
                        {po.approvedByName && (
                          <span className="ml-1 text-[10px] text-green-600">✓ approved</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                        {po.supplierName}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {po.sourceReferenceNumber ? (
                          <Link
                            href={`/proposals/${po.sourceProposalId}`}
                            className="text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {po.sourceReferenceNumber}
                          </Link>
                        ) : po.rfqReferenceNumber ? (
                          <span className="text-gray-500">{po.rfqReferenceNumber}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-700">
                        {po.items.length}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        ₹{po.totalAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {new Date(po.orderDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {po.expectedDeliveryDate
                          ? new Date(po.expectedDeliveryDate).toLocaleDateString("en-IN")
                          : "—"}
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
