"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { procurementService, TradingRFQ, TradingPurchaseOrder } from "@/lib/procurement";
import { ProposalResponse } from "@/types/proposal";
import { showToast } from "@/lib/toast";
import {
  Plus,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Package,
} from "lucide-react";
import CreateRfqModal from "./CreateRfqModal";

// ── Status helpers ────────────────────────────────────────────────────────────

function rfqStatusColor(status: string) {
  switch (status) {
    case "DRAFT":
      return "bg-gray-100 text-gray-700";
    case "SENT":
      return "bg-blue-100 text-blue-700";
    case "RESPONSE_RECEIVED":
      return "bg-yellow-100 text-yellow-700";
    case "ACCEPTED":
      return "bg-green-100 text-green-700";
    case "CLOSED":
      return "bg-purple-100 text-purple-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function poStatusColor(status: string) {
  switch (status) {
    case "DRAFT":
      return "bg-gray-100 text-gray-700";
    case "SUBMITTED":
      return "bg-yellow-100 text-yellow-700";
    case "APPROVED":
      return "bg-green-100 text-green-700";
    case "SENT":
      return "bg-blue-100 text-blue-700";
    case "RECEIVED":
      return "bg-purple-100 text-purple-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

// ── Progress tracker ──────────────────────────────────────────────────────────

function ProcurementProgress({
  proposal,
  rfqs,
  pos,
}: {
  proposal: ProposalResponse;
  rfqs: TradingRFQ[];
  pos: TradingPurchaseOrder[];
}) {
  const totalItems = proposal.lineItems?.length ?? 0;

  // Items covered by at least one RFQ
  const rfqCoveredIndexes = new Set(
    rfqs
      .filter((r) => r.status !== "CANCELLED")
      .flatMap((r) => r.items.map((i) => i.sourceLineItemIndex))
  );
  // Items covered by at least one PO
  const poCoveredIndexes = new Set(
    pos
      .filter((p) => p.status !== "CANCELLED")
      .flatMap((p) => p.items.map((i) => i.sourceLineItemIndex ?? -1).filter((i) => i >= 0))
  );

  const rfqSent = rfqs.filter(
    (r) =>
      r.status === "SENT" ||
      r.status === "RESPONSE_RECEIVED" ||
      r.status === "ACCEPTED" ||
      r.status === "CLOSED"
  ).length;
  const responses = rfqs.filter(
    (r) => r.status === "RESPONSE_RECEIVED" || r.status === "ACCEPTED" || r.status === "CLOSED"
  ).length;
  const posCreated = pos.filter((p) => p.status !== "CANCELLED").length;
  const posApproved = pos.filter(
    (p) => p.status === "APPROVED" || p.status === "SENT" || p.status === "RECEIVED"
  ).length;

  const steps = [
    { label: "RFQs Sent", value: rfqSent, done: rfqSent > 0 },
    { label: "Responses In", value: responses, done: responses > 0 },
    { label: "POs Created", value: posCreated, done: posCreated > 0 },
    { label: "POs Approved", value: posApproved, done: posApproved > 0 },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Procurement Progress</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`rounded-lg p-3 text-center ${s.done ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-200"}`}
          >
            <div className={`text-2xl font-bold ${s.done ? "text-green-700" : "text-gray-400"}`}>
              {s.value}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
      {totalItems > 0 && (
        <div className="text-xs text-gray-500">
          Item coverage: <span className="font-medium text-blue-700">{rfqCoveredIndexes.size}</span>{" "}
          of {totalItems} items have RFQs •{" "}
          <span className="font-medium text-green-700">{poCoveredIndexes.size}</span> of{" "}
          {totalItems} items have POs
        </div>
      )}
    </div>
  );
}

// ── Item Coverage Matrix ──────────────────────────────────────────────────────

function ItemCoverageMatrix({
  proposal,
  rfqs,
  pos,
  isAdmin,
}: {
  proposal: ProposalResponse;
  rfqs: TradingRFQ[];
  pos: TradingPurchaseOrder[];
  isAdmin: boolean;
}) {
  const items = proposal.lineItems ?? [];
  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-800">Item Coverage</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-gray-600 font-medium">Item</th>
              <th className="px-3 py-2 text-right text-gray-600 font-medium">Sell Qty</th>
              {isAdmin && (
                <th className="px-3 py-2 text-right text-gray-600 font-medium">Sell Price</th>
              )}
              <th className="px-3 py-2 text-center text-gray-600 font-medium">RFQs</th>
              <th className="px-3 py-2 text-center text-gray-600 font-medium">Best Buy</th>
              {isAdmin && (
                <th className="px-3 py-2 text-center text-gray-600 font-medium">Margin</th>
              )}
              <th className="px-3 py-2 text-center text-gray-600 font-medium">PO Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, idx) => {
              const itemRfqs = rfqs.filter(
                (r) =>
                  r.status !== "CANCELLED" && r.items.some((i) => i.sourceLineItemIndex === idx)
              );
              const itemPos = pos.filter(
                (p) =>
                  p.status !== "CANCELLED" && p.items.some((i) => i.sourceLineItemIndex === idx)
              );

              // Best buy price across all vendor responses for this item
              let bestBuy: number | null = null;
              rfqs.forEach((r) => {
                r.responses.forEach((resp) => {
                  resp.lineQuotes?.forEach((lq) => {
                    if (lq.sourceLineItemIndex === idx && lq.quotedUnitPrice != null) {
                      if (bestBuy === null || lq.quotedUnitPrice < bestBuy) {
                        bestBuy = lq.quotedUnitPrice;
                      }
                    }
                  });
                });
              });

              const sellPrice = item.unitPrice ?? 0;
              const bestBuyVal: number | null = bestBuy;
              const margin: number | null = bestBuyVal != null ? sellPrice - bestBuyVal : null;
              const hasPo = itemPos.length > 0;
              const hasRfq = itemRfqs.length > 0;

              return (
                <tr
                  key={idx}
                  className={`${hasPo ? "bg-green-50/40" : hasRfq ? "bg-yellow-50/40" : ""}`}
                >
                  <td className="px-3 py-2 font-medium text-gray-900 max-w-[200px] truncate">
                    {item.productName || item.description || `Item ${idx + 1}`}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">{item.quantity}</td>
                  {isAdmin && (
                    <td className="px-3 py-2 text-right text-gray-700">
                      ₹{sellPrice.toLocaleString("en-IN")}
                    </td>
                  )}
                  <td className="px-3 py-2 text-center">
                    {itemRfqs.length > 0 ? (
                      <span className="inline-block px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                        {itemRfqs.length}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-700">
                    {bestBuyVal !== null ? (
                      `₹${(bestBuyVal as number).toLocaleString("en-IN")}`
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td
                      className={`px-3 py-2 text-center font-medium ${margin !== null ? ((margin as number) >= 0 ? "text-green-700" : "text-red-600") : "text-gray-300"}`}
                    >
                      {margin !== null ? `₹${(margin as number).toLocaleString("en-IN")}` : "—"}
                    </td>
                  )}
                  <td className="px-3 py-2 text-center">
                    {hasPo ? (
                      <span className="inline-block px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-medium">
                        {itemPos[0].status}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-[10px]">No PO</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main ProcurementTab ───────────────────────────────────────────────────────

interface Props {
  proposal: ProposalResponse;
  isAdmin: boolean;
}

export default function ProcurementTab({ proposal, isAdmin }: Props) {
  const [rfqs, setRfqs] = useState<TradingRFQ[]>([]);
  const [pos, setPos] = useState<TradingPurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateRfq, setShowCreateRfq] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [rfqData, poData] = await Promise.all([
        procurementService.getTradingRfqsByProposal(proposal.id),
        procurementService.getTradingPosByProposal(proposal.id),
      ]);
      setRfqs(rfqData);
      setPos(poData);
    } catch {
      // silently fail — tab shows empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [proposal.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
        Loading procurement data...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress tracker */}
      <ProcurementProgress proposal={proposal} rfqs={rfqs} pos={pos} />

      {/* Item coverage matrix */}
      <ItemCoverageMatrix proposal={proposal} rfqs={rfqs} pos={pos} isAdmin={isAdmin} />

      {/* RFQ List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">
            Requests for Quotation
            {rfqs.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-500">({rfqs.length})</span>
            )}
          </h3>
          <button
            onClick={() => setShowCreateRfq(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create RFQ
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {rfqs.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">
              No RFQs yet. Click "Create RFQ" to start sourcing items.
            </p>
          ) : (
            rfqs.map((rfq) => (
              <div key={rfq.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Link
                      href={`/rfqs/${rfq.id}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {rfq.rfqId}
                    </Link>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${rfqStatusColor(rfq.status)}`}
                    >
                      {rfq.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {rfq.vendorNames?.join(", ") || "No vendors"} • {rfq.items.length} item
                    {rfq.items.length !== 1 ? "s" : ""}
                    {rfq.deadline && ` • Due ${new Date(rfq.deadline).toLocaleDateString("en-IN")}`}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {rfq.responses.length} response{rfq.responses.length !== 1 ? "s" : ""}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* PO List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">
            Purchase Orders
            {pos.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-500">({pos.length})</span>
            )}
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {pos.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">
              No POs yet. Convert an accepted RFQ to create a PO.
            </p>
          ) : (
            pos.map((po) => (
              <div key={po.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Link
                      href={`/purchase-orders/${po.id}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {po.tradingPoId}
                    </Link>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${poStatusColor(po.status)}`}
                    >
                      {po.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {po.supplierName} • {po.items.length} item{po.items.length !== 1 ? "s" : ""} • ₹
                    {po.totalAmount?.toLocaleString("en-IN")}
                    {po.rfqReferenceNumber && ` • from ${po.rfqReferenceNumber}`}
                  </div>
                </div>
                {isAdmin && po.totalAmount > 0 && (
                  <div className="text-xs text-gray-500 font-medium">
                    ₹{po.totalAmount.toLocaleString("en-IN")}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create RFQ Modal */}
      {showCreateRfq && (
        <CreateRfqModal
          proposal={proposal}
          onClose={() => setShowCreateRfq(false)}
          onCreated={() => {
            setShowCreateRfq(false);
            load();
          }}
        />
      )}
    </div>
  );
}
