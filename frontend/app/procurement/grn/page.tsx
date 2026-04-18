"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  procurementService,
  GRN,
  CreateGrnRequest,
  GrnLineItem,
  QualityStatus,
} from "@/lib/procurement";
import { authService } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import { Plus, X, Trash2 } from "lucide-react";

const QUALITY_COLORS: Record<QualityStatus, string> = {
  ACCEPTED: "bg-green-100 text-green-800",
  PARTIALLY_ACCEPTED: "bg-yellow-100 text-yellow-800",
  REJECTED: "bg-red-100 text-red-800",
};

const emptyLineItem = (): GrnLineItem => ({
  partId: "",
  orderedQty: 0,
  receivedQty: 0,
  condition: "",
});

export default function GrnListPage() {
  const router = useRouter();
  const [grns, setGrns] = useState<GRN[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form
  const [poId, setPoId] = useState("");
  const [receivedDate, setReceivedDate] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [qualityStatus, setQualityStatus] = useState<QualityStatus>("ACCEPTED");
  const [remarks, setRemarks] = useState("");
  const [lineItems, setLineItems] = useState<GrnLineItem[]>([emptyLineItem()]);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await procurementService.getAllGrns();
      setGrns(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load GRNs");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPoId("");
    setReceivedDate("");
    setReceivedBy("");
    setQualityStatus("ACCEPTED");
    setRemarks("");
    setLineItems([emptyLineItem()]);
  };

  const updateLineItem = (
    index: number,
    field: keyof GrnLineItem,
    value: string | number
  ) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poId.trim() || !receivedDate || !receivedBy.trim()) {
      showToast.error("PO ID, received date, and received by are required");
      return;
    }
    const validItems = lineItems.filter((item) => item.partId.trim());
    if (validItems.length === 0) {
      showToast.error("At least one line item with a Part ID is required");
      return;
    }
    const payload: CreateGrnRequest = {
      poId,
      receivedDate,
      receivedBy,
      lineItems: validItems,
      qualityStatus,
      remarks,
    };
    try {
      setSaving(true);
      await procurementService.createGrn(payload);
      showToast.success("GRN created successfully");
      setShowModal(false);
      resetForm();
      load();
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Failed to create GRN");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Goods Receipt Notes</h1>
          <p className="text-slate-500 text-sm mt-1">Track received goods against purchase orders</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create GRN
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : error ? (
        <div className="text-red-600 text-sm bg-red-50 p-4 rounded-lg">{error}</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">GRN Number</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">PO ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Received Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Received By</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Quality Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Items</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {grns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      No GRNs found. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  grns.map((grn) => (
                    <tr key={grn.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {grn.grnNumber ?? grn.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{grn.poId}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(grn.receivedDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{grn.receivedBy}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${QUALITY_COLORS[grn.qualityStatus]}`}
                        >
                          {grn.qualityStatus.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{grn.lineItems?.length ?? 0}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                        {grn.remarks ?? "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">Create GRN</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    PO ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={poId}
                    onChange={(e) => setPoId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Received Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Received By <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Quality Status</label>
                  <select
                    value={qualityStatus}
                    onChange={(e) => setQualityStatus(e.target.value as QualityStatus)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ACCEPTED">Accepted</option>
                    <option value="PARTIALLY_ACCEPTED">Partially Accepted</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-600">Line Items</label>
                  <button
                    type="button"
                    onClick={() => setLineItems((prev) => [...prev, emptyLineItem()])}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {lineItems.map((item, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <input
                        type="text"
                        placeholder="Part ID *"
                        value={item.partId}
                        onChange={(e) => updateLineItem(i, "partId", e.target.value)}
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Ordered"
                        min={0}
                        value={item.orderedQty}
                        onChange={(e) => updateLineItem(i, "orderedQty", Number(e.target.value))}
                        className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Received"
                        min={0}
                        value={item.receivedQty}
                        onChange={(e) => updateLineItem(i, "receivedQty", Number(e.target.value))}
                        className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Condition"
                        value={item.condition ?? ""}
                        onChange={(e) => updateLineItem(i, "condition", e.target.value)}
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setLineItems((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        disabled={lineItems.length === 1}
                        className="text-red-400 hover:text-red-600 p-2 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create GRN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
