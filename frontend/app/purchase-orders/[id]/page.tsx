"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { procurementService, TradingPurchaseOrder, TradingPoLineItem } from "@/lib/procurement";
import { showToast } from "@/lib/toast";
import {
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  X,
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ShoppingCart,
  Ban,
} from "lucide-react";

const poStatusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  DRAFT: {
    color: "bg-gray-100 text-gray-700",
    icon: <Clock className="w-3.5 h-3.5" />,
    label: "Draft",
  },
  SUBMITTED: {
    color: "bg-yellow-100 text-yellow-700",
    icon: <Send className="w-3.5 h-3.5" />,
    label: "Awaiting Approval",
  },
  APPROVED: {
    color: "bg-blue-100 text-blue-700",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    label: "Approved",
  },
  SENT: {
    color: "bg-indigo-100 text-indigo-700",
    icon: <Send className="w-3.5 h-3.5" />,
    label: "Sent to Supplier",
  },
  RECEIVING: {
    color: "bg-orange-100 text-orange-700",
    icon: <Package className="w-3.5 h-3.5" />,
    label: "In Receiving",
  },
  RECEIVED: {
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    label: "Received",
  },
  CANCELLED: {
    color: "bg-red-100 text-red-700",
    icon: <XCircle className="w-3.5 h-3.5" />,
    label: "Cancelled",
  },
  CLOSED: {
    color: "bg-purple-100 text-purple-700",
    icon: <XCircle className="w-3.5 h-3.5" />,
    label: "Closed",
  },
};

function getPoStatus(s: string) {
  return poStatusConfig[s] ?? { color: "bg-gray-100 text-gray-600", icon: null, label: s };
}

const PO_TIMELINE = [
  { status: "DRAFT", label: "Created", desc: "PO created as draft" },
  { status: "SUBMITTED", label: "Submitted", desc: "Submitted for approval" },
  { status: "APPROVED", label: "Approved", desc: "Approved by admin" },
  { status: "SENT", label: "Sent", desc: "Sent to supplier" },
  { status: "RECEIVING", label: "Receiving", desc: "Goods being received" },
  { status: "RECEIVED", label: "Received", desc: "Goods fully received" },
];

function getTimelineIndex(status: string): number {
  const idx = PO_TIMELINE.findIndex((t) => t.status === status);
  return idx >= 0 ? idx : 0;
}

export default function PoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [po, setPo] = useState<TradingPurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    load();
    const u = localStorage.getItem("crm_user");
    if (u) {
      try {
        const parsed = JSON.parse(u);
        setIsAdmin(parsed.isAdmin ?? false);
      } catch {
        /* ignore */
      }
    }
  }, [id]);

  async function load() {
    try {
      setLoading(true);
      const data = await procurementService.getTradingPoById(id);
      setPo(data);
    } catch {
      setError("Purchase Order not found");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!po) return;
    setActionLoading(true);
    try {
      const updated = await procurementService.submitPoForApproval(po.id);
      setPo(updated);
      showToast.success("PO submitted for approval");
    } catch (e: any) {
      showToast.error(e.message || "Failed to submit");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApprove() {
    if (!po) return;
    setActionLoading(true);
    try {
      const updated = await procurementService.approvePo(po.id, "ADMIN", "Approved");
      setPo(updated);
      showToast.success("PO approved");
    } catch (e: any) {
      showToast.error(e.message || "Failed to approve");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!po) return;
    if (!rejectReason.trim()) {
      showToast.error("Please provide a rejection reason");
      return;
    }
    setActionLoading(true);
    try {
      const updated = await procurementService.rejectPo(po.id, "ADMIN", rejectReason);
      setPo(updated);
      setShowRejectModal(false);
      setRejectReason("");
      showToast.success("PO rejected");
    } catch (e: any) {
      showToast.error(e.message || "Failed to reject");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSend() {
    if (!po) return;
    setActionLoading(true);
    try {
      const updated = await procurementService.sendPo(po.id);
      setPo(updated);
      showToast.success("PO sent to supplier");
    } catch (e: any) {
      showToast.error(e.message || "Failed to send");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMarkReceived() {
    if (!po) return;
    setActionLoading(true);
    try {
      const updated = await procurementService.markPoReceived(po.id);
      setPo(updated);
      showToast.success("PO marked as received");
    } catch (e: any) {
      showToast.error(e.message || "Failed to mark received");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!po) return;
    setActionLoading(true);
    try {
      const updated = await procurementService.cancelPo(po.id);
      setPo(updated);
      showToast.success("PO cancelled");
    } catch (e: any) {
      showToast.error(e.message || "Failed to cancel");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading Purchase Order...
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="flex flex-col items-center py-20 text-gray-500">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p>{error ?? "Purchase Order not found"}</p>
        <Link href="/proposals" className="mt-3 text-blue-600 text-sm hover:underline">
          Back to Proposals
        </Link>
      </div>
    );
  }

  const status = getPoStatus(po.status);
  const timelineIdx = getTimelineIndex(po.status);
  const canSubmit = po.status === "DRAFT";
  const canApprove = po.status === "SUBMITTED" && isAdmin;
  const canSend = po.status === "APPROVED";
  const canReceive = po.status === "SENT" || po.status === "RECEIVING";
  const canCancel = !["CANCELLED", "RECEIVED", "CLOSED"].includes(po.status);

  // Total buy and (admin only) total margin
  const totalBuy = po.items.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalSell = po.items.reduce(
    (sum, item) => sum + (item.sellUnitPrice ?? 0) * item.orderedQuantity,
    0
  );
  const totalMargin = totalSell - totalBuy;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      {/* Back */}
      <Link
        href="/proposals"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-2"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Proposals
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-start justify-between px-6 py-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-gray-900">{po.tradingPoId}</h1>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}
              >
                {status.icon}
                {status.label}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              {po.sourceReferenceNumber && (
                <span>
                  From:{" "}
                  <Link
                    href={`/proposals/${po.sourceProposalId}`}
                    className="text-blue-600 hover:underline"
                  >
                    {po.sourceReferenceNumber}
                  </Link>
                </span>
              )}
              {po.rfqReferenceNumber && <span>RFQ: {po.rfqReferenceNumber}</span>}
              <span>
                Supplier: <span className="font-medium text-gray-700">{po.supplierName}</span>
              </span>
              <span>Order Date: {new Date(po.orderDate).toLocaleDateString("en-IN")}</span>
              {po.expectedDeliveryDate && (
                <span>
                  Expected: {new Date(po.expectedDeliveryDate).toLocaleDateString("en-IN")}
                </span>
              )}
            </div>
            {po.paymentTerms && (
              <p className="text-xs text-gray-500 mt-1">Payment terms: {po.paymentTerms}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {canSubmit && (
              <button
                onClick={handleSubmit}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Submit for Approval
              </button>
            )}
            {canApprove && (
              <>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Approve
                </button>
              </>
            )}
            {canSend && (
              <button
                onClick={handleSend}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send to Supplier
              </button>
            )}
            {canReceive && (
              <button
                onClick={handleMarkReceived}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Package className="w-4 h-4" />
                )}
                Mark Received
              </button>
            )}
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                <Ban className="w-4 h-4" /> Cancel
              </button>
            )}
          </div>
        </div>

        {po.notes && (
          <div className="px-6 pb-4 text-sm text-gray-600 border-t border-gray-100 pt-3">
            <span className="font-medium text-gray-700">Notes:</span> {po.notes}
          </div>
        )}
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Order Status Timeline</h3>
        <div className="flex items-center gap-0">
          {PO_TIMELINE.map((step, i) => {
            const done = i <= timelineIdx;
            const current = i === timelineIdx;
            return (
              <React.Fragment key={step.status}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                    ${done ? "bg-green-600 text-white" : "bg-gray-100 text-gray-400"}
                    ${current ? "ring-2 ring-green-400 ring-offset-1" : ""}`}
                  >
                    {i + 1}
                  </div>
                  <div
                    className={`text-xs mt-1 font-medium text-center ${done ? "text-green-700" : "text-gray-400"}`}
                  >
                    {step.label}
                  </div>
                </div>
                {i < PO_TIMELINE.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 ${i < timelineIdx ? "bg-green-500" : "bg-gray-200"}`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
        {po.approvedAt && po.approvedByName && (
          <p className="text-xs text-gray-500 mt-3 text-center">
            Approved by {po.approvedByName} on {new Date(po.approvedAt).toLocaleDateString("en-IN")}
          </p>
        )}
        {po.rejectionReason && po.rejectedBy && (
          <p className="text-xs text-red-600 mt-3 text-center">Rejected: {po.rejectionReason}</p>
        )}
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Line Items</h2>
          <div className="flex items-center gap-4 text-xs">
            {isAdmin && (
              <>
                <span className="text-gray-600">
                  Total Buy:{" "}
                  <span className="font-semibold text-gray-900">
                    ₹{totalBuy.toLocaleString("en-IN")}
                  </span>
                </span>
                <span className="text-gray-600">
                  Total Sell:{" "}
                  <span className="font-semibold text-gray-900">
                    ₹{totalSell.toLocaleString("en-IN")}
                  </span>
                </span>
                <span
                  className={`font-semibold ${totalMargin >= 0 ? "text-green-700" : "text-red-600"}`}
                >
                  Margin: ₹{totalMargin.toLocaleString("en-IN")}
                </span>
              </>
            )}
            <span className="font-semibold text-gray-900">
              Grand Total: ₹{po.totalAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">#</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Product</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Ordered</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Received</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">
                  Unit Price
                </th>
                {isAdmin && (
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">
                    Sell Price
                  </th>
                )}
                {isAdmin && (
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Margin</th>
                )}
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {po.items.map((item, idx) => {
                const sellPrice = item.sellUnitPrice ?? 0;
                const margin =
                  sellPrice > 0 ? sellPrice * item.orderedQuantity - item.totalAmount : null;
                const receivedPct =
                  item.orderedQuantity > 0
                    ? (item.receivedQuantity / item.orderedQuantity) * 100
                    : 0;
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-2 font-medium text-gray-900 max-w-[200px] truncate">
                      {item.productName || item.description || `Item ${idx + 1}`}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-700">
                      {item.orderedQuantity} {item.uom ?? ""}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span
                        className={`font-medium ${receivedPct === 100 ? "text-green-700" : receivedPct > 0 ? "text-yellow-700" : "text-gray-400"}`}
                      >
                        {item.receivedQuantity}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-gray-700">
                      ₹{item.unitPrice.toLocaleString("en-IN")}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-2 text-right text-gray-700">
                        {sellPrice > 0 ? `₹${sellPrice.toLocaleString("en-IN")}` : "—"}
                      </td>
                    )}
                    {isAdmin && (
                      <td
                        className={`px-4 py-2 text-right font-medium ${
                          margin === null
                            ? "text-gray-300"
                            : margin >= 0
                              ? "text-green-700"
                              : "text-red-600"
                        }`}
                      >
                        {margin !== null ? `₹${margin.toLocaleString("en-IN")}` : "—"}
                      </td>
                    )}
                    <td className="px-4 py-2 text-right font-medium text-gray-900">
                      ₹{item.totalAmount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td
                  colSpan={isAdmin ? 5 : 3}
                  className="px-4 py-2 text-right text-sm font-semibold text-gray-800"
                >
                  Subtotal
                </td>
                {isAdmin && <td />}
                <td className="px-4 py-2 text-right text-sm font-semibold text-gray-900">
                  ₹{po.subtotal.toLocaleString("en-IN")}
                </td>
              </tr>
              <tr>
                <td
                  colSpan={isAdmin ? 5 : 3}
                  className="px-4 py-1 text-right text-xs text-gray-500"
                >
                  Total Amount
                </td>
                {isAdmin && <td />}
                <td className="px-4 py-1 text-right text-sm font-bold text-gray-900">
                  ₹{po.totalAmount.toLocaleString("en-IN")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-red-600">Reject Purchase Order</h2>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <p className="text-sm text-gray-600">
                You are about to reject <strong>{po.tradingPoId}</strong>. This action cannot be
                undone.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  rows={3}
                  placeholder="Why is this PO being rejected?"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
