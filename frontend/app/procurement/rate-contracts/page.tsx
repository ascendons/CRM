"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  procurementService,
  RateContract,
  CreateRateContractRequest,
  RateContractLineItem,
  RateContractStatus,
} from "@/lib/procurement";
import { authService } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import { Plus, X, Trash2, XCircle } from "lucide-react";

const STATUS_COLORS: Record<RateContractStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  TERMINATED: "bg-red-100 text-red-800",
  EXPIRED: "bg-gray-100 text-gray-700",
};

const emptyLineItem = (): RateContractLineItem => ({
  partId: "",
  agreedUnitPrice: 0,
  minOrderQty: 1,
});

export default function RateContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<RateContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);

  // Form
  const [vendorId, setVendorId] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [autoRenew, setAutoRenew] = useState(false);
  const [lineItems, setLineItems] = useState<RateContractLineItem[]>([emptyLineItem()]);

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
      const data = await procurementService.getAllRateContracts();
      setContracts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load rate contracts");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setVendorId("");
    setValidFrom("");
    setValidTo("");
    setAutoRenew(false);
    setLineItems([emptyLineItem()]);
  };

  const updateLineItem = (
    index: number,
    field: keyof RateContractLineItem,
    value: string | number
  ) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId.trim() || !validFrom || !validTo) {
      showToast.error("Vendor ID, valid from, and valid to are required");
      return;
    }
    const validItems = lineItems.filter((item) => item.partId.trim());
    if (validItems.length === 0) {
      showToast.error("At least one line item is required");
      return;
    }
    const payload: CreateRateContractRequest = {
      vendorId,
      lineItems: validItems,
      validFrom,
      validTo,
      autoRenew,
    };
    try {
      setSaving(true);
      await procurementService.createRateContract(payload);
      showToast.success("Rate contract created");
      setShowModal(false);
      resetForm();
      load();
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Failed to create rate contract");
    } finally {
      setSaving(false);
    }
  };

  const handleTerminate = async (id: string) => {
    if (!confirm("Are you sure you want to terminate this rate contract?")) return;
    try {
      setTerminatingId(id);
      await procurementService.terminateRateContract(id);
      showToast.success("Rate contract terminated");
      load();
    } catch {
      showToast.error("Failed to terminate rate contract");
    } finally {
      setTerminatingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Rate Contracts</h1>
          <p className="text-slate-500 text-sm mt-1">Manage agreed pricing with vendors</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Rate Contract
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
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">RC Number</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Vendor ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Valid From</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Valid To</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Items</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Auto Renew</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      No rate contracts found. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  contracts.map((rc) => (
                    <tr key={rc.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {rc.rcNumber ?? rc.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{rc.vendorId}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(rc.validFrom).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(rc.validTo).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{rc.lineItems?.length ?? 0}</td>
                      <td className="px-4 py-3 text-slate-600">{rc.autoRenew ? "Yes" : "No"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[rc.status]}`}
                        >
                          {rc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {rc.status === "ACTIVE" && (
                          <button
                            onClick={() => handleTerminate(rc.id)}
                            disabled={terminatingId === rc.id}
                            className="flex items-center gap-1 text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50 transition-colors"
                            title="Terminate"
                          >
                            <XCircle className="w-4 h-4" />
                            {terminatingId === rc.id ? "Terminating..." : "Terminate"}
                          </button>
                        )}
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
              <h2 className="text-lg font-semibold text-slate-800">Create Rate Contract</h2>
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
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Vendor ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    placeholder="Enter vendor ID"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Valid From <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Valid To <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={validTo}
                    onChange={(e) => setValidTo(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoRenew"
                  checked={autoRenew}
                  onChange={(e) => setAutoRenew(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="autoRenew" className="text-sm text-slate-700">
                  Auto Renew
                </label>
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
                        placeholder="Unit Price"
                        min={0}
                        value={item.agreedUnitPrice}
                        onChange={(e) =>
                          updateLineItem(i, "agreedUnitPrice", Number(e.target.value))
                        }
                        className="w-28 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Min Qty"
                        min={1}
                        value={item.minOrderQty}
                        onChange={(e) =>
                          updateLineItem(i, "minOrderQty", Number(e.target.value))
                        }
                        className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  {saving ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
