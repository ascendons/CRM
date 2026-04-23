"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { procurementService, RFQ, VendorResponseItem } from "@/lib/procurement";
import { authService } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function RfqDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Select vendor
  const [selectingVendor, setSelectingVendor] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState("");

  // Add vendor response
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseForm, setResponseForm] = useState<Partial<VendorResponseItem>>({
    vendorId: "",
    unitPrice: 0,
    deliveryDays: 0,
    notes: "",
  });
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    load();
  }, [id]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await procurementService.getRfqById(id);
      setRfq(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load RFQ");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVendor = async () => {
    if (!selectedVendorId.trim()) {
      showToast.error("Enter a vendor ID to select");
      return;
    }
    try {
      setSelectingVendor(true);
      await procurementService.selectRfqVendor(id, selectedVendorId.trim());
      showToast.success("Vendor selected, RFQ closed");
      load();
    } catch {
      showToast.error("Failed to select vendor");
    } finally {
      setSelectingVendor(false);
    }
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseForm.vendorId?.trim()) {
      showToast.error("Vendor ID is required");
      return;
    }
    try {
      setSubmittingResponse(true);
      await procurementService.submitVendorResponse(id, responseForm as VendorResponseItem);
      showToast.success("Response submitted");
      setShowResponseForm(false);
      setResponseForm({ vendorId: "", unitPrice: 0, deliveryDays: 0, notes: "" });
      load();
    } catch {
      showToast.error("Failed to submit response");
    } finally {
      setSubmittingResponse(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !rfq) {
    return (
      <div className="p-6">
        <div className="text-red-600 text-sm bg-red-50 p-4 rounded-lg">
          {error ?? "RFQ not found"}
        </div>
      </div>
    );
  }

  const isClosed = rfq.status !== "OPEN";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/procurement/rfq")}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">{rfq.rfqNumber}</h1>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  rfq.status === "OPEN"
                    ? "bg-green-100 text-green-800"
                    : rfq.status === "CANCELLED"
                      ? "bg-red-100 text-red-800"
                      : "bg-slate-100 text-slate-700"
                }`}
              >
                {rfq.status}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">
              Deadline: {new Date(rfq.deadline).toLocaleDateString()}
            </p>
          </div>
        </div>
        {!isClosed && (
          <button
            onClick={() => setShowResponseForm(true)}
            className="flex items-center gap-2 px-3 py-2 border border-blue-200 text-blue-600 rounded-lg text-sm hover:bg-blue-50 transition-colors"
          >
            + Add Vendor Response
          </button>
        )}
      </div>

      {/* Description */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-600 mb-2">Description</h2>
        <p className="text-slate-700 text-sm">{rfq.description}</p>
        {rfq.vendorIds?.length > 0 && (
          <div className="mt-3">
            <span className="text-xs text-slate-500">Vendors invited: </span>
            {rfq.vendorIds.map((vid) => (
              <span
                key={vid}
                className="ml-1 bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded"
              >
                {vid}
              </span>
            ))}
          </div>
        )}
        {rfq.selectedVendorId && (
          <div className="mt-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">
              Selected Vendor: {rfq.selectedVendorId}
            </span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-600">Items ({rfq.items?.length ?? 0})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Part ID</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Quantity</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Specifications</th>
              </tr>
            </thead>
            <tbody>
              {(rfq.items ?? []).map((item, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{item.partId}</td>
                  <td className="px-4 py-3 text-slate-600">{item.qty}</td>
                  <td className="px-4 py-3 text-slate-600">{item.specs ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor Responses */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-600">
            Vendor Responses ({rfq.vendorResponses?.length ?? 0})
          </h2>
        </div>
        {!rfq.vendorResponses || rfq.vendorResponses.length === 0 ? (
          <p className="text-slate-400 text-sm p-5">No vendor responses yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Vendor ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Unit Price</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">
                    Delivery (days)
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Notes</th>
                </tr>
              </thead>
              <tbody>
                {rfq.vendorResponses.map((resp, i) => (
                  <tr
                    key={i}
                    className={`border-t border-slate-100 ${
                      rfq.selectedVendorId === resp.vendorId ? "bg-green-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {resp.vendorId}
                      {rfq.selectedVendorId === resp.vendorId && (
                        <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                          Selected
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      ₹{resp.unitPrice?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{resp.deliveryDays}</td>
                    <td className="px-4 py-3 text-slate-600">{resp.notes ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Select Vendor */}
      {!isClosed && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-600 mb-3">Select Vendor & Close RFQ</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter Vendor ID to select"
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSelectVendor}
              disabled={selectingVendor}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {selectingVendor ? "Selecting..." : "Select & Close"}
            </button>
          </div>
        </div>
      )}

      {/* Add Vendor Response Modal */}
      {showResponseForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">Submit Vendor Response</h2>
              <button
                onClick={() => setShowResponseForm(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmitResponse} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Vendor ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={responseForm.vendorId ?? ""}
                  onChange={(e) => setResponseForm((p) => ({ ...p, vendorId: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={responseForm.unitPrice ?? ""}
                    onChange={(e) =>
                      setResponseForm((p) => ({ ...p, unitPrice: Number(e.target.value) }))
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Delivery Days
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={responseForm.deliveryDays ?? ""}
                    onChange={(e) =>
                      setResponseForm((p) => ({ ...p, deliveryDays: Number(e.target.value) }))
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                <textarea
                  value={responseForm.notes ?? ""}
                  onChange={(e) => setResponseForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowResponseForm(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingResponse}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {submittingResponse ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
