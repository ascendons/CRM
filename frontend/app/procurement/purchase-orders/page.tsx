"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import { showToast } from "@/lib/toast";
import { CheckCircle2, XCircle, Clock, ChevronRight, X, ClipboardList } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ApprovalLevel = "L1" | "L2" | "L3";
type ApprovalStatus = "Pending" | "Approved" | "Rejected";

interface ApprovalStep {
  level: ApprovalLevel;
  status: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId?: string;
  vendorName?: string;
  totalAmount: number;
  status: string;
  approvalWorkflow?: ApprovalStep[];
  createdAt: string;
}

type ActionType = "approve" | "reject";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getApprovalThresholdLabel(amount: number): string {
  if (amount < 50_000) return "L1 approval only";
  if (amount <= 5_00_000) return "L1 + L2 approval";
  return "L1 + L2 + L3 approval";
}

function getFirstPendingLevel(workflow?: ApprovalStep[]): ApprovalLevel | null {
  if (!workflow) return null;
  const step = workflow.find((s) => s.status === "Pending");
  return step ? step.level : null;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-orange-100 text-orange-700",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_BADGE[status] ?? "bg-slate-100 text-slate-600";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}
    >
      {status}
    </span>
  );
}

function StepIcon({ status }: { status: ApprovalStatus }) {
  if (status === "Approved") return <CheckCircle2 className="w-5 h-5 text-green-500" />;
  if (status === "Rejected") return <XCircle className="w-5 h-5 text-red-500" />;
  return <Clock className="w-5 h-5 text-slate-300" />;
}

function ApprovalStepper({ workflow }: { workflow: ApprovalStep[] }) {
  return (
    <div className="flex items-center gap-1 mt-3">
      {workflow.map((step, i) => (
        <div key={step.level} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
          <div className="flex items-center gap-1.5">
            <StepIcon status={step.status} />
            <div>
              <p className="text-xs font-medium text-slate-700 leading-none">{step.level}</p>
              <p
                className={`text-[10px] leading-none mt-0.5 ${
                  step.status === "Approved"
                    ? "text-green-600"
                    : step.status === "Rejected"
                      ? "text-red-600"
                      : "text-slate-400"
                }`}
              >
                {step.status}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ActionModalProps {
  po: PurchaseOrder;
  actionType: ActionType;
  onClose: () => void;
  onDone: () => void;
}

function ActionModal({ po, actionType, onClose, onDone }: ActionModalProps) {
  const firstPending = getFirstPendingLevel(po.approvalWorkflow);
  const [level, setLevel] = useState<ApprovalLevel>(firstPending ?? "L1");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const availableLevels: ApprovalLevel[] = ["L1", "L2", "L3"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const endpoint = `/procurement/purchase-orders/${po.id}/${actionType}`;
      await api.post(endpoint, { level, comments: comments.trim() || undefined });
      showToast.success(
        actionType === "approve"
          ? `PO ${po.poNumber} approved at ${level}`
          : `PO ${po.poNumber} rejected at ${level}`
      );
      onDone();
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : `Failed to ${actionType} PO`);
    } finally {
      setSubmitting(false);
    }
  };

  const isApprove = actionType === "approve";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              {isApprove ? "Approve" : "Reject"} Purchase Order
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{po.poNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* PO summary */}
          <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Vendor</span>
              <span className="font-medium text-slate-700">
                {po.vendorName ?? po.vendorId ?? "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount</span>
              <span className="font-semibold text-slate-800">{formatINR(po.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Required</span>
              <span className="text-slate-600 text-xs">
                {getApprovalThresholdLabel(po.totalAmount)}
              </span>
            </div>
          </div>

          {/* Level selector */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Approval Level <span className="text-red-500">*</span>
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as ApprovalLevel)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableLevels.map((l) => (
                <option key={l} value={l}>
                  {l}
                  {l === firstPending ? " (current pending)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Comments{isApprove ? " (optional)" : ""}
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              placeholder={isApprove ? "Add any remarks (optional)..." : "Reason for rejection..."}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                isApprove ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {submitting
                ? isApprove
                  ? "Approving..."
                  : "Rejecting..."
                : isApprove
                  ? "Approve"
                  : "Reject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── PO Card ──────────────────────────────────────────────────────────────────

interface POCardProps {
  po: PurchaseOrder;
  onAction: (po: PurchaseOrder, action: ActionType) => void;
}

function POCard({ po, onAction }: POCardProps) {
  const firstPending = getFirstPendingLevel(po.approvalWorkflow);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 truncate">{po.poNumber}</p>
          <p className="text-sm text-slate-500 mt-0.5">
            {po.vendorName ?? po.vendorId ?? "Unknown Vendor"}
          </p>
        </div>
        <StatusBadge status={po.status} />
      </div>

      {/* Amount + threshold */}
      <div className="mt-3 flex items-baseline gap-3">
        <span className="text-xl font-bold text-slate-900">{formatINR(po.totalAmount)}</span>
        <span className="text-xs text-slate-400">{getApprovalThresholdLabel(po.totalAmount)}</span>
      </div>

      {/* Approval stepper */}
      {po.approvalWorkflow && po.approvalWorkflow.length > 0 && (
        <ApprovalStepper workflow={po.approvalWorkflow} />
      )}

      {/* Date */}
      <p className="text-xs text-slate-400 mt-3">
        Created{" "}
        {new Date(po.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>

      {/* Action buttons — only show if there is a pending step */}
      {firstPending && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => onAction(po, "approve")}
            className="flex-1 flex items-center justify-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Approve
          </button>
          <button
            onClick={() => onAction(po, "reject")}
            className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function POApprovalPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [actionType, setActionType] = useState<ActionType>("approve");

  const loadPendingOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<PurchaseOrder[]>("/procurement/purchase-orders/pending-approval");
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pending approvals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingOrders();
  }, [loadPendingOrders]);

  const openModal = (po: PurchaseOrder, action: ActionType) => {
    setSelectedPO(po);
    setActionType(action);
  };

  const closeModal = () => {
    setSelectedPO(null);
  };

  const handleDone = () => {
    closeModal();
    loadPendingOrders();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">PO Approval</h1>
        <p className="text-slate-500 text-sm mt-1">
          Review and action purchase orders pending your approval
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
          <button onClick={loadPendingOrders} className="ml-3 underline hover:no-underline">
            Retry
          </button>
        </div>
      ) : orders.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center h-64 text-center bg-white rounded-xl border border-slate-200">
          <ClipboardList className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">No pending approvals</p>
          <p className="text-slate-400 text-sm mt-1">All purchase orders are up to date.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            {orders.length} purchase order{orders.length !== 1 ? "s" : ""} pending approval
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((po) => (
              <POCard key={po.id} po={po} onAction={openModal} />
            ))}
          </div>
        </>
      )}

      {/* Action modal */}
      {selectedPO && (
        <ActionModal
          po={selectedPO}
          actionType={actionType}
          onClose={closeModal}
          onDone={handleDone}
        />
      )}
    </div>
  );
}
