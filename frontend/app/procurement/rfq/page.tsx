"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { procurementService, RFQ, RfqStatus, CreateRfqRequest, RfqItem } from "@/lib/procurement";
import { authService } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import { Plus, X, Trash2 } from "lucide-react";

const STATUS_COLORS: Record<RfqStatus, string> = {
  OPEN: "bg-green-100 text-green-800",
  CLOSED: "bg-slate-100 text-slate-700",
  CANCELLED: "bg-red-100 text-red-800",
};

const emptyItem = (): RfqItem => ({ partId: "", qty: 1, specs: "" });

export default function RfqListPage() {
  const router = useRouter();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [description, setDescription] = useState("");
  const [vendorIds, setVendorIds] = useState("");
  const [deadline, setDeadline] = useState("");
  const [items, setItems] = useState<RfqItem[]>([emptyItem()]);

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
      const data = await procurementService.getAllRfqs();
      setRfqs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load RFQs");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDescription("");
    setVendorIds("");
    setDeadline("");
    setItems([emptyItem()]);
  };

  const updateItem = (index: number, field: keyof RfqItem, value: string | number) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !deadline) {
      showToast.error("Description and deadline are required");
      return;
    }
    const validItems = items.filter((item) => item.partId.trim());
    if (validItems.length === 0) {
      showToast.error("At least one item with a Part ID is required");
      return;
    }
    const payload: CreateRfqRequest = {
      description,
      items: validItems,
      vendorIds: vendorIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      deadline,
    };
    try {
      setSaving(true);
      await procurementService.createRfq(payload);
      showToast.success("RFQ created successfully");
      setShowModal(false);
      resetForm();
      load();
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Failed to create RFQ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Request for Quotation</h1>
          <p className="text-slate-500 text-sm mt-1">Manage procurement RFQs</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create RFQ
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
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">RFQ Number</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Description</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Deadline</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Vendors</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Items</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {rfqs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      No RFQs found. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  rfqs.map((rfq) => (
                    <tr
                      key={rfq.id}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/procurement/rfq/${rfq.id}`)}
                    >
                      <td className="px-4 py-3 font-medium text-blue-600">{rfq.rfqNumber}</td>
                      <td className="px-4 py-3 text-slate-700 max-w-xs truncate">
                        {rfq.description}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(rfq.deadline).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{rfq.vendorIds?.length ?? 0}</td>
                      <td className="px-4 py-3 text-slate-600">{rfq.items?.length ?? 0}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[rfq.status]}`}
                        >
                          {rfq.status}
                        </span>
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
              <h2 className="text-lg font-semibold text-slate-800">Create RFQ</h2>
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
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Deadline <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Vendor IDs (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={vendorIds}
                    onChange={(e) => setVendorIds(e.target.value)}
                    placeholder="id1, id2, id3"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-600">Items</label>
                  <button
                    type="button"
                    onClick={() => setItems((prev) => [...prev, emptyItem()])}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <input
                        type="text"
                        placeholder="Part ID *"
                        value={item.partId}
                        onChange={(e) => updateItem(i, "partId", e.target.value)}
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        min={1}
                        value={item.qty}
                        onChange={(e) => updateItem(i, "qty", Number(e.target.value))}
                        className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Specs"
                        value={item.specs ?? ""}
                        onChange={(e) => updateItem(i, "specs", e.target.value)}
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                        disabled={items.length === 1}
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
                  {saving ? "Creating..." : "Create RFQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
