"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  procurementService,
  TradingRFQ,
  TradingRfqItem,
  VendorResponseDetail,
  LineQuote,
  Vendor,
  TradingPurchaseOrder,
} from "@/lib/procurement";
import { showToast } from "@/lib/toast";
import {
  ArrowLeft,
  Send,
  XCircle,
  CheckCircle,
  Clock,
  Loader2,
  Plus,
  X,
  Package,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  ShoppingCart,
} from "lucide-react";

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  DRAFT: {
    color: "bg-gray-100 text-gray-700",
    icon: <Clock className="w-3.5 h-3.5" />,
    label: "Draft",
  },
  SENT: {
    color: "bg-blue-100 text-blue-700",
    icon: <Send className="w-3.5 h-3.5" />,
    label: "Sent to Vendors",
  },
  RESPONSE_RECEIVED: {
    color: "bg-yellow-100 text-yellow-700",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    label: "Response Received",
  },
  ACCEPTED: {
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    label: "Accepted",
  },
  CLOSED: {
    color: "bg-purple-100 text-purple-700",
    icon: <XCircle className="w-3.5 h-3.5" />,
    label: "Closed",
  },
  CANCELLED: {
    color: "bg-red-100 text-red-700",
    icon: <XCircle className="w-3.5 h-3.5" />,
    label: "Cancelled",
  },
};

function getRfqStatus(s: string) {
  return statusConfig[s] ?? { color: "bg-gray-100 text-gray-600", icon: null, label: s };
}

export default function RfqDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [rfq, setRfq] = useState<TradingRFQ | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Vendor response form
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [respondVendorId, setRespondVendorId] = useState("");
  const [respondVendorName, setRespondVendorName] = useState("");
  const [lineQuotes, setLineQuotes] = useState<Record<number, { price: string; qty: string }>>({});
  const [deliveryDays, setDeliveryDays] = useState("");
  const [vendorNotes, setVendorNotes] = useState("");
  const [savingResponse, setSavingResponse] = useState(false);

  // Convert to PO modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedVendorForPo, setSelectedVendorForPo] = useState("");
  const [selectedVendorName, setSelectedVendorName] = useState("");
  const [selectedLineIndexes, setSelectedLineIndexes] = useState<Set<number>>(new Set());
  const [poDeliveryDate, setPoDeliveryDate] = useState("");
  const [poNotes, setPoNotes] = useState("");
  const [converting, setConverting] = useState(false);

  // Send / Cancel
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    load();
    const u = localStorage.getItem("crm_user");
    if (u) {
      try {
        const parsed = JSON.parse(u);
        setCurrentUserId(parsed.id ?? "");
        setIsAdmin(parsed.isAdmin ?? false);
      } catch {
        /* ignore */
      }
    }
  }, [id]);

  async function load() {
    try {
      setLoading(true);
      const data = await procurementService.getTradingRfqById(id);
      setRfq(data);
    } catch {
      setError("RFQ not found");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!rfq) return;
    setActionLoading(true);
    try {
      const updated = await procurementService.sendTradingRfq(rfq.id);
      setRfq(updated);
      showToast.success("RFQ sent to vendors");
    } catch (e: any) {
      showToast.error(e.message || "Failed to send RFQ");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!rfq) return;
    setActionLoading(true);
    try {
      const updated = await procurementService.cancelTradingRfq(rfq.id);
      setRfq(updated);
      showToast.success("RFQ cancelled");
    } catch (e: any) {
      showToast.error(e.message || "Failed to cancel RFQ");
    } finally {
      setActionLoading(false);
    }
  }

  // Open respond modal for a specific vendor
  function openRespondModal(vendorId: string, vendorName: string) {
    setRespondVendorId(vendorId);
    setRespondVendorName(vendorName);
    const existing = rfq?.responses.find((r) => r.vendorId === vendorId);
    const init: Record<number, { price: string; qty: string }> = {};
    rfq?.items.forEach((item) => {
      const existingQuote = existing?.lineQuotes.find(
        (q) => q.sourceLineItemIndex === item.sourceLineItemIndex
      );
      init[item.sourceLineItemIndex] = {
        price: existingQuote ? String(existingQuote.quotedUnitPrice) : "",
        qty: existingQuote?.quotedQty ? String(existingQuote.quotedQty) : String(item.requestedQty),
      };
    });
    setLineQuotes(init);
    setDeliveryDays(existing?.deliveryDays ? String(existing.deliveryDays) : "");
    setVendorNotes(existing?.notes ?? "");
    setShowRespondModal(true);
  }

  async function handleSaveResponse() {
    if (!rfq) return;
    setSavingResponse(true);
    try {
      const quotes: LineQuote[] = rfq.items.map((item) => ({
        sourceLineItemIndex: item.sourceLineItemIndex,
        quotedUnitPrice: parseFloat(lineQuotes[item.sourceLineItemIndex]?.price ?? "0") || 0,
        quotedQty:
          parseFloat(lineQuotes[item.sourceLineItemIndex]?.qty ?? "0") || item.requestedQty,
      }));
      await procurementService.recordVendorResponse(rfq.id, {
        vendorId: respondVendorId,
        lineQuotes: quotes,
        deliveryDays: deliveryDays ? parseInt(deliveryDays) : undefined,
        notes: vendorNotes || undefined,
      });
      showToast.success("Vendor response recorded");
      setShowRespondModal(false);
      await load();
    } catch (e: any) {
      showToast.error(e.message || "Failed to save response");
    } finally {
      setSavingResponse(false);
    }
  }

  // Open convert modal
  function openConvertModal(vendorId: string, vendorName: string) {
    setSelectedVendorForPo(vendorId);
    setSelectedVendorName(vendorName);
    setSelectedLineIndexes(new Set(rfq?.items.map((i) => i.sourceLineItemIndex) ?? []));
    setPoDeliveryDate("");
    setPoNotes("");
    setShowConvertModal(true);
  }

  async function handleConvertToPo() {
    if (!rfq) return;
    setConverting(true);
    try {
      const po = await procurementService.convertRfqToPo(rfq.id, {
        vendorId: selectedVendorForPo,
        lineItemIndexes: Array.from(selectedLineIndexes),
        expectedDeliveryDate: poDeliveryDate || undefined,
        notes: poNotes || undefined,
      });
      showToast.success(`PO ${po.tradingPoId} created`);
      setShowConvertModal(false);
      router.push(`/purchase-orders/${po.id}`);
    } catch (e: any) {
      showToast.error(e.message || "Failed to convert to PO");
    } finally {
      setConverting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading RFQ...
      </div>
    );
  }

  if (error || !rfq) {
    return (
      <div className="flex flex-col items-center py-20 text-gray-500">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p>{error ?? "RFQ not found"}</p>
        <Link href="/proposals" className="mt-3 text-blue-600 text-sm hover:underline">
          Back to Proposals
        </Link>
      </div>
    );
  }

  const status = getRfqStatus(rfq.status);
  const canSend = rfq.status === "DRAFT";
  const canCancel = rfq.status !== "CANCELLED" && rfq.status !== "CLOSED";

  // Best buy per item index
  const bestBuy: Record<number, number> = {};
  rfq.responses.forEach((resp) => {
    resp.lineQuotes.forEach((lq) => {
      if (lq.quotedUnitPrice > 0) {
        if (
          bestBuy[lq.sourceLineItemIndex] === undefined ||
          lq.quotedUnitPrice < bestBuy[lq.sourceLineItemIndex]
        ) {
          bestBuy[lq.sourceLineItemIndex] = lq.quotedUnitPrice;
        }
      }
    });
  });

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
              <h1 className="text-lg font-bold text-gray-900">{rfq.rfqId}</h1>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}
              >
                {status.icon}
                {status.label}
              </span>
            </div>
            {rfq.title && <p className="text-sm text-gray-600 mt-1">{rfq.title}</p>}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              {rfq.sourceReferenceNumber && (
                <span>
                  From:{" "}
                  <Link
                    href={`/proposals/${rfq.sourceId}`}
                    className="text-blue-600 hover:underline"
                  >
                    {rfq.sourceReferenceNumber}
                  </Link>
                </span>
              )}
              {rfq.deadline && (
                <span>Deadline: {new Date(rfq.deadline).toLocaleDateString("en-IN")}</span>
              )}
              <span>
                {rfq.items.length} item{rfq.items.length !== 1 ? "s" : ""}
              </span>
              <span>
                {rfq.vendorIds.length} vendor{rfq.vendorIds.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canSend && (
              <button
                onClick={handleSend}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send to Vendors
              </button>
            )}
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> Cancel
              </button>
            )}
          </div>
        </div>
        {rfq.notes && (
          <div className="px-6 pb-4 text-sm text-gray-600 border-t border-gray-100 pt-3">
            <span className="font-medium text-gray-700">Notes:</span> {rfq.notes}
          </div>
        )}
      </div>

      {/* Item table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-800">RFQ Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">#</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Product</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Qty</th>
                {isAdmin && (
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">
                    Sell Price
                  </th>
                )}
                {isAdmin && (
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">
                    Best Buy
                  </th>
                )}
                {isAdmin && (
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">
                    Best Margin
                  </th>
                )}
                {rfq.responses.length > 0 && (
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">
                    Responses
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rfq.items.map((item, idx) => {
                const buy = bestBuy[item.sourceLineItemIndex];
                const sell = item.sellUnitPrice ?? 0;
                const margin = buy ? sell - buy : null;

                // Count vendors who quoted for this item
                const respCount = rfq.responses.filter((r) =>
                  r.lineQuotes.some(
                    (q) =>
                      q.sourceLineItemIndex === item.sourceLineItemIndex && q.quotedUnitPrice > 0
                  )
                ).length;

                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {item.productName || item.description || `Item ${idx + 1}`}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-700">
                      {item.requestedQty} {item.unit ?? ""}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-2 text-right text-gray-700">
                        {sell > 0 ? `₹${sell.toLocaleString("en-IN")}` : "—"}
                      </td>
                    )}
                    {isAdmin && (
                      <td className="px-4 py-2 text-right text-gray-700">
                        {buy ? (
                          `₹${buy.toLocaleString("en-IN")}`
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
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
                    {rfq.responses.length > 0 && (
                      <td className="px-4 py-2 text-center">
                        {respCount > 0 ? (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                            {respCount}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">0</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor Responses */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-800">
            Vendor Responses
            {rfq.responses.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({rfq.responses.length})
              </span>
            )}
          </h2>
        </div>

        {rfq.responses.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">
            No responses yet. Send the RFQ to vendors and ask for quotes.
          </div>
        ) : (
          rfq.responses.map((resp) => {
            const vendorBestBuy: Record<number, number> = {};
            rfq.responses
              .filter((r) => r.vendorId === resp.vendorId)
              .forEach((r) =>
                r.lineQuotes.forEach((lq) => {
                  vendorBestBuy[lq.sourceLineItemIndex] = lq.quotedUnitPrice;
                })
              );

            return (
              <div key={resp.vendorId} className="border-b border-gray-100 last:border-0">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {resp.vendorName || resp.vendorId}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                      {resp.deliveryDays && <span>{resp.deliveryDays} day delivery</span>}
                      {resp.respondedAt && (
                        <span>
                          Responded {new Date(resp.respondedAt).toLocaleDateString("en-IN")}
                        </span>
                      )}
                    </div>
                    {resp.notes && <p className="text-xs text-gray-500 mt-1">{resp.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openConvertModal(resp.vendorId, resp.vendorName)}
                      disabled={rfq.status === "CANCELLED" || rfq.status === "CLOSED"}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> Convert to PO
                    </button>
                    <button
                      onClick={() => openRespondModal(resp.vendorId, resp.vendorName)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      <Plus className="w-3.5 h-3.5" /> Edit Response
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-1.5 text-left text-gray-600 font-medium">Item</th>
                        <th className="px-4 py-1.5 text-right text-gray-600 font-medium">
                          Requested Qty
                        </th>
                        {isAdmin && (
                          <th className="px-4 py-1.5 text-right text-gray-600 font-medium">
                            Sell Price
                          </th>
                        )}
                        <th className="px-4 py-1.5 text-right text-gray-600 font-medium">
                          Quoted Price
                        </th>
                        {isAdmin && (
                          <th className="px-4 py-1.5 text-right text-gray-600 font-medium">
                            Margin
                          </th>
                        )}
                        <th className="px-4 py-1.5 text-right text-gray-600 font-medium">
                          Quoted Qty
                        </th>
                        {isAdmin && (
                          <th className="px-4 py-1.5 text-center text-gray-600 font-medium">
                            Best Buy?
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {rfq.items.map((item, idx) => {
                        const quote = resp.lineQuotes.find(
                          (q) => q.sourceLineItemIndex === item.sourceLineItemIndex
                        );
                        const quotedPrice = quote?.quotedUnitPrice ?? 0;
                        const quotedQty = quote?.quotedQty ?? item.requestedQty;
                        const sellPrice = item.sellUnitPrice ?? 0;
                        const margin = quotedPrice > 0 ? sellPrice - quotedPrice : null;
                        const isBestBuy =
                          bestBuy[item.sourceLineItemIndex] != null &&
                          quotedPrice > 0 &&
                          quotedPrice <= bestBuy[item.sourceLineItemIndex]!;

                        return (
                          <tr key={idx} className={quotedPrice === 0 ? "opacity-50" : ""}>
                            <td className="px-4 py-1.5 text-gray-700">
                              {item.productName || item.description || `Item ${idx + 1}`}
                            </td>
                            <td className="px-4 py-1.5 text-right text-gray-600">
                              {item.requestedQty} {item.unit ?? ""}
                            </td>
                            {isAdmin && (
                              <td className="px-4 py-1.5 text-right text-gray-700">
                                {sellPrice > 0 ? `₹${sellPrice.toLocaleString("en-IN")}` : "—"}
                              </td>
                            )}
                            <td
                              className={`px-4 py-1.5 text-right font-medium ${quotedPrice === 0 ? "text-gray-400" : "text-gray-900"}`}
                            >
                              {quotedPrice > 0 ? `₹${quotedPrice.toLocaleString("en-IN")}` : "—"}
                            </td>
                            {isAdmin && (
                              <td
                                className={`px-4 py-1.5 text-right font-medium ${
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
                            <td className="px-4 py-1.5 text-right text-gray-600">
                              {quotedPrice > 0 ? `${quotedQty} ${item.unit ?? ""}` : "—"}
                            </td>
                            {isAdmin && (
                              <td className="px-4 py-1.5 text-center">
                                {isBestBuy ? (
                                  <span className="inline-block px-1 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-bold">
                                    BEST
                                  </span>
                                ) : quotedPrice > 0 ? (
                                  <span className="text-gray-300">—</span>
                                ) : null}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Record Response for vendors not yet responded */}
      {rfq.status !== "CANCELLED" && rfq.status !== "CLOSED" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-800">Record Vendor Response</h2>
          </div>
          <div className="p-4">
            {rfq.vendorIds.map((vendorId) => {
              const resp = rfq.responses.find((r) => r.vendorId === vendorId);
              const vendorName = rfq.vendorNames[rfq.vendorIds.indexOf(vendorId)] || vendorId;
              return (
                <div
                  key={vendorId}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-800">{vendorName}</span>
                    {resp ? (
                      <span className="ml-2 text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Responded
                      </span>
                    ) : (
                      <span className="ml-2 text-xs text-gray-400">No response yet</span>
                    )}
                  </div>
                  <button
                    onClick={() => openRespondModal(vendorId, vendorName)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    {resp ? (
                      <Plus className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    {resp ? "Update Response" : "Record Response"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vendor Response Modal */}
      {showRespondModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">
                Record Response — {respondVendorName}
              </h2>
              <button
                onClick={() => setShowRespondModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="text-xs text-gray-500 bg-blue-50 rounded-lg p-3">
                Fill in the quoted prices for each line item. Leave price blank or 0 if the vendor
                cannot supply that item.
              </div>
              {rfq.items.map((item) => (
                <div
                  key={item.sourceLineItemIndex}
                  className="border border-gray-200 rounded-lg p-3"
                >
                  <div className="text-sm font-medium text-gray-800 mb-2">
                    {item.productName || item.description || `Item ${item.sourceLineItemIndex + 1}`}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-0.5 block">
                        Quoted Unit Price (₹)
                      </label>
                      <input
                        type="number"
                        value={lineQuotes[item.sourceLineItemIndex]?.price ?? ""}
                        onChange={(e) =>
                          setLineQuotes((prev) => ({
                            ...prev,
                            [item.sourceLineItemIndex]: {
                              ...prev[item.sourceLineItemIndex],
                              price: e.target.value,
                              qty: prev[item.sourceLineItemIndex]?.qty ?? String(item.requestedQty),
                            },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        placeholder="0.00"
                        min={0}
                        step={0.01}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-0.5 block">
                        Quoted Qty <span className="text-gray-400">(req: {item.requestedQty})</span>
                      </label>
                      <input
                        type="number"
                        value={
                          lineQuotes[item.sourceLineItemIndex]?.qty ?? String(item.requestedQty)
                        }
                        onChange={(e) =>
                          setLineQuotes((prev) => ({
                            ...prev,
                            [item.sourceLineItemIndex]: {
                              ...prev[item.sourceLineItemIndex],
                              qty: e.target.value,
                              price: prev[item.sourceLineItemIndex]?.price ?? "",
                            },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        min={0.01}
                        step={0.01}
                      />
                    </div>
                  </div>
                  {isAdmin && item.sellUnitPrice && (
                    <div className="mt-1.5 text-xs text-gray-500">
                      Sell price: ₹{item.sellUnitPrice.toLocaleString("en-IN")} — Margin:{" "}
                      {(() => {
                        const p = parseFloat(lineQuotes[item.sourceLineItemIndex]?.price ?? "0");
                        return p > 0
                          ? `₹${(item.sellUnitPrice! - p).toLocaleString("en-IN")}`
                          : "—";
                      })()}
                    </div>
                  )}
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-500 mb-0.5 block">Delivery Days</label>
                <input
                  type="number"
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="e.g. 7"
                  min={1}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-0.5 block">Notes</label>
                <textarea
                  value={vendorNotes}
                  onChange={(e) => setVendorNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  rows={2}
                  placeholder="Any conditions, partial supply, etc."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowRespondModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveResponse}
                disabled={savingResponse}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {savingResponse ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Save Response
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert to PO Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Convert to Purchase Order</h2>
              <button
                onClick={() => setShowConvertModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                Creating PO for <strong>{selectedVendorName}</strong> from RFQ{" "}
                <strong>{rfq.rfqId}</strong>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Items to Include
                </label>
                <div className="space-y-1">
                  {rfq.items.map((item) => (
                    <label
                      key={item.sourceLineItemIndex}
                      className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLineIndexes.has(item.sourceLineItemIndex)}
                        onChange={(e) => {
                          const next = new Set(selectedLineIndexes);
                          if (e.target.checked) next.add(item.sourceLineItemIndex);
                          else next.delete(item.sourceLineItemIndex);
                          setSelectedLineIndexes(next);
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm text-gray-800 flex-1">
                        {item.productName ||
                          item.description ||
                          `Item ${item.sourceLineItemIndex + 1}`}
                      </span>
                      <span className="text-xs text-gray-500">
                        {item.requestedQty} {item.unit ?? ""}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  value={poDeliveryDate}
                  onChange={(e) => setPoDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PO Notes</label>
                <textarea
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  rows={2}
                  placeholder="Delivery instructions, payment terms, etc."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowConvertModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConvertToPo}
                disabled={converting || selectedLineIndexes.size === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {converting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4" />
                )}
                Create Purchase Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
