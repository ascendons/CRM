"use client";

import React, { useState, useEffect } from "react";
import { ProposalResponse } from "@/types/proposal";
import {
  procurementService,
  Vendor,
  TradingRfqItem,
  CreateTradingRfqRequest,
} from "@/lib/procurement";
import { showToast } from "@/lib/toast";
import { X, Loader2, Plus, Minus, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  proposal: ProposalResponse;
  onClose: () => void;
  onCreated: () => void;
}

const inputCls =
  "w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";

export default function CreateRfqModal({ proposal, onClose, onCreated }: Props) {
  const [step, setStep] = useState(1); // 1=items, 2=vendors, 3=details
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Step 1: item selection + qty
  const [selectedItems, setSelectedItems] = useState<Record<number, TradingRfqItem>>({});

  // Step 2: vendor selection
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);

  // Step 3: details
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [sendNow, setSendNow] = useState(false);

  const lineItems = proposal.lineItems ?? [];

  useEffect(() => {
    procurementService
      .getAllVendors()
      .then(setVendors)
      .catch(() => {})
      .finally(() => setVendorsLoading(false));
  }, []);

  // ── Step 1 helpers ──────────────────────────────────────────────────────────

  function toggleItem(idx: number) {
    setSelectedItems((prev) => {
      if (prev[idx]) {
        const next = { ...prev };
        delete next[idx];
        return next;
      }
      const src = lineItems[idx];
      return {
        ...prev,
        [idx]: {
          sourceLineItemIndex: idx,
          productId: src.productId,
          productName: src.productName || src.description || `Item ${idx + 1}`,
          description: src.description,
          requestedQty: src.quantity ?? 1,
          unit: src.unit,
          sellUnitPrice: src.unitPrice,
        },
      };
    });
  }

  function setQty(idx: number, qty: number) {
    if (qty <= 0) return;
    setSelectedItems((prev) => ({
      ...prev,
      [idx]: { ...prev[idx], requestedQty: qty },
    }));
  }

  function setTargetPrice(idx: number, price: string) {
    setSelectedItems((prev) => ({
      ...prev,
      [idx]: { ...prev[idx], targetPrice: price ? parseFloat(price) : undefined },
    }));
  }

  const selectedCount = Object.keys(selectedItems).length;

  // ── Step 2 helpers ──────────────────────────────────────────────────────────

  function toggleVendor(id: string) {
    setSelectedVendorIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (selectedCount === 0) {
      showToast.error("Select at least one item");
      return;
    }
    if (selectedVendorIds.length === 0) {
      showToast.error("Select at least one vendor");
      return;
    }

    setSaving(true);
    try {
      const req: CreateTradingRfqRequest = {
        title: title || undefined,
        sourceType: "QUOTATION",
        sourceId: proposal.id,
        items: Object.values(selectedItems),
        vendorIds: selectedVendorIds,
        deadline: deadline || undefined,
        notes: notes || undefined,
        sendImmediately: sendNow,
      };
      await procurementService.createTradingRfq(req);
      showToast.success("RFQ created successfully");
      onCreated();
    } catch (e: any) {
      showToast.error(e.message || "Failed to create RFQ");
    } finally {
      setSaving(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Create RFQ</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              From {proposal.referenceNumber || proposal.proposalNumber}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-gray-100 text-xs">
          {["Select Items", "Select Vendors", "Details"].map((label, i) => (
            <React.Fragment key={i}>
              <button
                onClick={() => i < step - 1 && setStep(i + 1)}
                className={`px-2 py-1 rounded ${step === i + 1 ? "bg-blue-600 text-white" : i + 1 < step ? "text-blue-600 font-medium cursor-pointer hover:underline" : "text-gray-400"}`}
              >
                {i + 1}. {label}
              </button>
              {i < 2 && <span className="text-gray-300 mx-1">›</span>}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Step 1: Items */}
          {step === 1 && (
            <div className="space-y-2">
              {lineItems.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">
                  No line items in this proposal.
                </p>
              ) : (
                lineItems.map((item, idx) => {
                  const sel = selectedItems[idx];
                  return (
                    <div
                      key={idx}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${sel ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                      onClick={() => toggleItem(idx)}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={!!sel}
                          readOnly
                          className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {item.productName || item.description || `Item ${idx + 1}`}
                            </span>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              ₹{(item.unitPrice ?? 0).toLocaleString("en-IN")} / unit
                            </span>
                          </div>
                          {sel && (
                            <div
                              className="mt-2 grid grid-cols-2 gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div>
                                <label className="text-xs text-gray-500 mb-0.5 block">
                                  Request Qty{" "}
                                  <span className="text-gray-400">(sell qty: {item.quantity})</span>
                                </label>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setQty(idx, (sel.requestedQty ?? 1) - 1)}
                                    className="p-1 rounded border border-gray-200 hover:bg-gray-100"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <input
                                    type="number"
                                    value={sel.requestedQty ?? 1}
                                    onChange={(e) => setQty(idx, parseFloat(e.target.value) || 1)}
                                    className="w-20 text-center px-2 py-1 border border-gray-200 rounded text-sm"
                                    min={0.01}
                                    step={0.01}
                                  />
                                  <button
                                    onClick={() => setQty(idx, (sel.requestedQty ?? 1) + 1)}
                                    className="p-1 rounded border border-gray-200 hover:bg-gray-100"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 mb-0.5 block">
                                  Target Price (₹)
                                </label>
                                <input
                                  type="number"
                                  value={sel.targetPrice ?? ""}
                                  onChange={(e) => setTargetPrice(idx, e.target.value)}
                                  placeholder="Optional ceiling"
                                  className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                                  min={0}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Step 2: Vendors */}
          {step === 2 && (
            <div className="space-y-2">
              {vendorsLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-6 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading vendors...
                </div>
              ) : vendors.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">
                  No vendors found. Add vendors in the Vendors section first.
                </p>
              ) : (
                vendors
                  .filter((v) => v.status === "ACTIVE")
                  .map((vendor) => (
                    <div
                      key={vendor.id}
                      onClick={() => toggleVendor(vendor.id)}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${selectedVendorIds.includes(vendor.id) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedVendorIds.includes(vendor.id)}
                          readOnly
                          className="w-4 h-4 rounded border-gray-300 text-blue-600"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {vendor.companyName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {vendor.contactPerson} • {vendor.email}
                            {vendor.rating && ` • ★ ${vendor.rating}/5`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>RFQ Title</label>
                <input
                  type="text"
                  className={inputCls}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`RFQ for ${proposal.referenceNumber || proposal.proposalNumber}`}
                />
              </div>
              <div>
                <label className={labelCls}>Response Deadline</label>
                <input
                  type="date"
                  className={inputCls}
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Notes to Vendors</label>
                <textarea
                  className={inputCls}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any special requirements, delivery instructions..."
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  checked={sendNow}
                  onChange={(e) => setSendNow(e.target.checked)}
                />
                Send RFQ to vendors immediately after creation
              </label>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                <div>
                  <span className="font-medium">Items:</span> {selectedCount} selected
                </div>
                <div>
                  <span className="font-medium">Vendors:</span> {selectedVendorIds.length} selected
                </div>
                <div>
                  <span className="font-medium">Source:</span>{" "}
                  {proposal.referenceNumber || proposal.proposalNumber}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 1 ? "Cancel" : "Back"}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {selectedCount} item{selectedCount !== 1 ? "s" : ""} • {selectedVendorIds.length}{" "}
              vendor{selectedVendorIds.length !== 1 ? "s" : ""}
            </span>
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && selectedCount === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={saving || selectedCount === 0 || selectedVendorIds.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {sendNow ? "Create & Send RFQ" : "Create RFQ (Draft)"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
