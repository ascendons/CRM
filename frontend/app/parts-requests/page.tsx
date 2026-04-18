"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package,
  Loader2,
  Inbox,
  CheckCircle2,
  XCircle,
  Truck,
  ClipboardCheck,
  Clock,
  X,
} from "lucide-react";
import { dispatchService, PartsRequest } from "@/lib/dispatch";
import { showToast } from "@/lib/toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type PartsStatus = PartsRequest["status"];

function statusBadge(status: PartsStatus) {
  const map: Record<PartsStatus, { label: string; cls: string }> = {
    PENDING: { label: "Pending", cls: "bg-yellow-100 text-yellow-700" },
    APPROVED: { label: "Approved", cls: "bg-blue-100 text-blue-700" },
    REJECTED: { label: "Rejected", cls: "bg-red-100 text-red-700" },
    DISPATCHED: { label: "Dispatched", cls: "bg-purple-100 text-purple-700" },
    RECEIVED: { label: "Received", cls: "bg-green-100 text-green-700" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-slate-100 text-slate-600" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function fmt(dateStr: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────

interface RejectModalProps {
  request: PartsRequest;
  onClose: () => void;
  onSuccess: () => void;
}

function RejectModal({ request, onClose, onSuccess }: RejectModalProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleReject() {
    if (!reason.trim()) {
      showToast.error("Please provide a rejection reason.");
      return;
    }
    setSubmitting(true);
    try {
      await dispatchService.rejectPartsRequest(request.id, reason.trim());
      showToast.success("Parts request rejected.");
      onSuccess();
    } catch {
      showToast.error("Failed to reject parts request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Reject Parts Request</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-5">
          <div className="bg-slate-50 rounded-lg p-3 text-sm mb-4">
            <p className="font-medium text-slate-700">{request.requestNumber}</p>
            <p className="text-slate-500 text-xs mt-0.5">WO: {request.workOrderId}</p>
          </div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Rejection Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Enter reason for rejection..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleReject}
            disabled={submitting}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            <XCircle size={14} />
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

interface StatsBarProps {
  requests: PartsRequest[];
}

function StatsBar({ requests }: StatsBarProps) {
  const counts = requests.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {} as Record<PartsStatus, number>
  );

  const stats = [
    { label: "Total", value: requests.length, cls: "text-slate-700", bg: "bg-slate-50" },
    { label: "Pending", value: counts.PENDING || 0, cls: "text-yellow-700", bg: "bg-yellow-50" },
    { label: "Approved", value: counts.APPROVED || 0, cls: "text-blue-700", bg: "bg-blue-50" },
    { label: "Dispatched", value: counts.DISPATCHED || 0, cls: "text-purple-700", bg: "bg-purple-50" },
    { label: "Received", value: counts.RECEIVED || 0, cls: "text-green-700", bg: "bg-green-50" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-white`}>
          <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
          <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type TabKey = "ALL" | "PENDING" | "APPROVED" | "DISPATCHED";

const TABS: { key: TabKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "DISPATCHED", label: "Dispatched" },
];

export default function PartsRequestsPage() {
  const [requests, setRequests] = useState<PartsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("ALL");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PartsRequest | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dispatchService.getAllPartsRequests();
      setRequests(data || []);
    } catch {
      showToast.error("Failed to load parts requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered =
    activeTab === "ALL" ? requests : requests.filter((r) => r.status === activeTab);

  async function handleApprove(req: PartsRequest) {
    setActioningId(req.id);
    try {
      await dispatchService.approvePartsRequest(req.id);
      showToast.success("Parts request approved.");
      loadData();
    } catch {
      showToast.error("Failed to approve request.");
    } finally {
      setActioningId(null);
    }
  }

  async function handleDispatch(req: PartsRequest) {
    setActioningId(req.id);
    try {
      await dispatchService.dispatchPartsRequest(req.id);
      showToast.success("Parts dispatched.");
      loadData();
    } catch {
      showToast.error("Failed to dispatch parts.");
    } finally {
      setActioningId(null);
    }
  }

  async function handleReceive(req: PartsRequest) {
    setActioningId(req.id);
    try {
      await dispatchService.receivePartsRequest(req.id);
      showToast.success("Parts marked as received.");
      loadData();
    } catch {
      showToast.error("Failed to mark received.");
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800">Parts Requests</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage warehouse parts requests from field engineers</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats */}
        {!loading && <StatsBar requests={requests} />}

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="flex border-b border-slate-100 overflow-x-auto">
            {TABS.map((tab) => {
              const count =
                tab.key === "ALL"
                  ? requests.length
                  : requests.filter((r) => r.status === tab.key).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab.label}
                  <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 size={28} className="animate-spin text-blue-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center text-slate-400 py-16">
              <Inbox size={40} className="mb-3 opacity-30" />
              <p className="text-sm">No parts requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Request #</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Work Order</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Engineer</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Parts</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Requested At</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {req.requestNumber}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600 font-mono text-xs">{req.workOrderId}</td>
                      <td className="px-5 py-3 text-slate-600 font-mono text-xs">{req.engineerId}</td>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Package size={13} className="text-slate-400" />
                          {req.requestedParts?.length ?? 0} item{(req.requestedParts?.length ?? 0) !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="px-5 py-3">{statusBadge(req.status)}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {fmt(req.requestedAt)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {req.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleApprove(req)}
                                disabled={actioningId === req.id}
                                className="flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg disabled:opacity-50 transition-colors"
                              >
                                {actioningId === req.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <CheckCircle2 size={12} />
                                )}
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectTarget(req)}
                                disabled={actioningId === req.id}
                                className="flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg disabled:opacity-50 transition-colors"
                              >
                                <XCircle size={12} />
                                Reject
                              </button>
                            </>
                          )}
                          {req.status === "APPROVED" && (
                            <button
                              onClick={() => handleDispatch(req)}
                              disabled={actioningId === req.id}
                              className="flex items-center gap-1 px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg disabled:opacity-50 transition-colors"
                            >
                              {actioningId === req.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Truck size={12} />
                              )}
                              Dispatch
                            </button>
                          )}
                          {req.status === "DISPATCHED" && (
                            <button
                              onClick={() => handleReceive(req)}
                              disabled={actioningId === req.id}
                              className="flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg disabled:opacity-50 transition-colors"
                            >
                              {actioningId === req.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <ClipboardCheck size={12} />
                              )}
                              Mark Received
                            </button>
                          )}
                          {(req.status === "RECEIVED" || req.status === "REJECTED") && (
                            <span className="text-xs text-slate-400 italic">No actions</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectTarget && (
        <RejectModal
          request={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onSuccess={() => {
            setRejectTarget(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
