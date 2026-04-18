"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  dealersService,
  Dealer,
  DealerOrder,
  DealerPerformance,
  PlaceOrderRequest,
} from "@/lib/dealers";
import { authService } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  ShieldOff,
  ShieldCheck,
  Package,
  TrendingUp,
  Info,
  Plus,
  X,
} from "lucide-react";

const TIER_STYLES: Record<string, string> = {
  PLATINUM: "bg-purple-100 text-purple-800 border border-purple-200",
  GOLD: "bg-amber-100 text-amber-800 border border-amber-200",
  SILVER: "bg-gray-100 text-gray-700 border border-gray-200",
  BRONZE: "bg-orange-100 text-orange-800 border border-orange-200",
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 border border-green-200",
  INACTIVE: "bg-gray-100 text-gray-600 border border-gray-200",
  SUSPENDED: "bg-red-100 text-red-800 border border-red-200",
};

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val || 0);
}

function CreditBar({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const color =
    pct > 80 ? "bg-red-500" : pct > 60 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-500">
        <span>
          {formatCurrency(used)} used of {formatCurrency(limit)}
        </span>
        <span>{pct.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-60 ${
              confirmClass || "bg-red-600 hover:bg-red-700"
            }`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Place Order Modal
function PlaceOrderModal({
  open,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PlaceOrderRequest) => void;
  loading: boolean;
}) {
  const [products, setProducts] = useState([
    { productId: "", qty: 1, unitPrice: 0 },
  ]);
  const [creditUsed, setCreditUsed] = useState(0);

  if (!open) return null;

  const totalValue = products.reduce((s, p) => s + p.qty * p.unitPrice, 0);

  function addProduct() {
    setProducts((prev) => [...prev, { productId: "", qty: 1, unitPrice: 0 }]);
  }

  function removeProduct(i: number) {
    setProducts((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateProduct(
    i: number,
    field: "productId" | "qty" | "unitPrice",
    value: string | number
  ) {
    setProducts((prev) =>
      prev.map((p, idx) =>
        idx === i
          ? {
              ...p,
              [field]:
                field === "productId" ? value : parseFloat(value as string) || 0,
            }
          : p
      )
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ products, totalValue, creditUsed });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Place Order</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Products */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">
                Products
              </label>
              <button
                type="button"
                onClick={addProduct}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Product
              </button>
            </div>
            <div className="space-y-2">
              {products.map((p, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Product ID"
                    value={p.productId}
                    onChange={(e) =>
                      updateProduct(i, "productId", e.target.value)
                    }
                    className="col-span-5 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={p.qty}
                    min={1}
                    onChange={(e) => updateProduct(i, "qty", e.target.value)}
                    className="col-span-2 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Unit Price"
                    value={p.unitPrice}
                    min={0}
                    onChange={(e) =>
                      updateProduct(i, "unitPrice", e.target.value)
                    }
                    className="col-span-4 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeProduct(i)}
                    disabled={products.length === 1}
                    className="col-span-1 p-1 text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between py-3 px-3 bg-slate-50 rounded-lg">
            <span className="text-sm font-medium text-slate-700">
              Total Value
            </span>
            <span className="font-bold text-slate-900">
              {formatCurrency(totalValue)}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Credit to Use (INR)
            </label>
            <input
              type="number"
              value={creditUsed}
              min={0}
              onChange={(e) => setCreditUsed(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || products.some((p) => !p.productId.trim())}
              className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors"
            >
              {loading ? "Placing..." : "Place Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type Tab = "overview" | "orders" | "performance";

export default function DealerDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [orders, setOrders] = useState<DealerOrder[]>([]);
  const [performance, setPerformance] = useState<DealerPerformance | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [perfLoading, setPerfLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const now = new Date();
  const [perfMonth, setPerfMonth] = useState(now.getMonth() + 1);
  const [perfYear, setPerfYear] = useState(now.getFullYear());

  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadDealer();
  }, [id]);

  useEffect(() => {
    if (activeTab === "orders" && orders.length === 0) loadOrders();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "performance") loadPerformance();
  }, [activeTab, perfMonth, perfYear]);

  async function loadDealer() {
    setLoading(true);
    try {
      const data = await dealersService.getDealerById(id);
      setDealer(data);
    } catch {
      showToast.error("Failed to load dealer.");
    } finally {
      setLoading(false);
    }
  }

  async function loadOrders() {
    setOrdersLoading(true);
    try {
      const data = await dealersService.getDealerOrders(id);
      setOrders(data);
    } catch {
      showToast.error("Failed to load orders.");
    } finally {
      setOrdersLoading(false);
    }
  }

  async function loadPerformance() {
    setPerfLoading(true);
    try {
      const data = await dealersService.getDealerPerformance(
        id,
        perfMonth,
        perfYear
      );
      setPerformance(data);
    } catch {
      setPerformance(null);
    } finally {
      setPerfLoading(false);
    }
  }

  async function handleStatusChange(
    newStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED"
  ) {
    setActionLoading(true);
    try {
      const updated = await dealersService.updateStatus(id, newStatus);
      setDealer(updated);
      showToast.success(`Dealer ${newStatus.toLowerCase()} successfully.`);
    } catch {
      showToast.error("Failed to update status.");
    } finally {
      setActionLoading(false);
      setShowSuspendModal(false);
    }
  }

  async function handleDelete() {
    setActionLoading(true);
    try {
      await dealersService.deleteDealer(id);
      showToast.success("Dealer deleted.");
      router.push("/dealers");
    } catch {
      showToast.error("Failed to delete dealer.");
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  }

  async function handlePlaceOrder(data: PlaceOrderRequest) {
    setOrderLoading(true);
    try {
      const order = await dealersService.placeOrder(id, data);
      setOrders((prev) => [order, ...prev]);
      setShowOrderModal(false);
      showToast.success("Order placed successfully.");
    } catch {
      showToast.error("Failed to place order.");
    } finally {
      setOrderLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!dealer) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Dealer not found.</p>
          <Link href="/dealers" className="text-blue-600 hover:underline text-sm">
            Back to Dealers
          </Link>
        </div>
      </div>
    );
  }

  const isSuspended = dealer.status === "SUSPENDED";

  const TABS: { key: Tab; label: string; icon: typeof Info }[] = [
    { key: "overview", label: "Overview", icon: Info },
    { key: "orders", label: "Orders", icon: Package },
    { key: "performance", label: "Performance", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Confirm modals */}
      <ConfirmModal
        open={showSuspendModal}
        title={isSuspended ? "Reactivate Dealer" : "Suspend Dealer"}
        message={
          isSuspended
            ? `Reactivate ${dealer.companyName}? They will regain active status.`
            : `Suspend ${dealer.companyName}? This will prevent them from placing orders.`
        }
        confirmLabel={isSuspended ? "Reactivate" : "Suspend"}
        confirmClass={
          isSuspended
            ? "bg-green-600 hover:bg-green-700"
            : "bg-red-600 hover:bg-red-700"
        }
        onConfirm={() =>
          handleStatusChange(isSuspended ? "ACTIVE" : "SUSPENDED")
        }
        onCancel={() => setShowSuspendModal(false)}
        loading={actionLoading}
      />
      <ConfirmModal
        open={showDeleteModal}
        title="Delete Dealer"
        message={`Permanently delete ${dealer.companyName}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        loading={actionLoading}
      />
      <PlaceOrderModal
        open={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        onSubmit={handlePlaceOrder}
        loading={orderLoading}
      />

      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dealers"
              className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">
                  {dealer.companyName}
                </h1>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    TIER_STYLES[dealer.tier] || ""
                  }`}
                >
                  {dealer.tier}
                </span>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    STATUS_STYLES[dealer.status] || ""
                  }`}
                >
                  {dealer.status}
                </span>
              </div>
              {dealer.dealerCode && (
                <p className="text-sm text-slate-500 mt-0.5 font-mono">
                  {dealer.dealerCode}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSuspendModal(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${
                isSuspended
                  ? "border-green-300 text-green-700 hover:bg-green-50"
                  : "border-orange-300 text-orange-700 hover:bg-orange-50"
              }`}
            >
              {isSuspended ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <ShieldOff className="w-4 h-4" />
              )}
              {isSuspended ? "Reactivate" : "Suspend"}
            </button>
            <Link
              href={`/dealers/${id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                  Company Details
                </h2>
                <dl className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Region", value: dealer.region },
                    { label: "Territory", value: dealer.territory },
                    { label: "GSTIN", value: dealer.GSTIN },
                    { label: "Onboarded", value: dealer.onboardedDate },
                    {
                      label: "Account Manager",
                      value: dealer.accountManagerId,
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <dt className="text-xs text-slate-500 mb-0.5">
                        {item.label}
                      </dt>
                      <dd className="text-sm font-medium text-slate-900">
                        {item.value || "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Credit Utilization */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                  Credit Utilization
                </h2>
                <CreditBar
                  used={dealer.currentCreditUsed || 0}
                  limit={dealer.creditLimit || 0}
                />
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Credit Limit</p>
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(dealer.creditLimit || 0)}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Credit Used</p>
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(dealer.currentCreditUsed || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 h-fit">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                Contact Information
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-slate-500">Contact Person</dt>
                  <dd className="text-sm font-medium text-slate-900 mt-0.5">
                    {dealer.contactPerson || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Email</dt>
                  <dd className="mt-0.5">
                    {dealer.email ? (
                      <a
                        href={`mailto:${dealer.email}`}
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        {dealer.email}
                      </a>
                    ) : (
                      <span className="text-sm text-slate-900">—</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Phone</dt>
                  <dd className="mt-0.5">
                    {dealer.phone ? (
                      <a
                        href={`tel:${dealer.phone}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {dealer.phone}
                      </a>
                    ) : (
                      <span className="text-sm text-slate-900">—</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">
                Order History
              </h2>
              <button
                onClick={() => setShowOrderModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Place Order
              </button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {ordersLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>No orders yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-3 font-medium text-slate-600">
                          Order Number
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">
                          Total Value
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">
                          Credit Used
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">
                          Status
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">
                          Placed At
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">
                          Delivered At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">
                            {order.orderNumber || order.id?.slice(0, 8)}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {formatCurrency(order.totalValue)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatCurrency(order.creditUsed)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {order.status || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {order.placedAt
                              ? new Date(order.placedAt).toLocaleDateString(
                                  "en-IN"
                                )
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {order.deliveredAt
                              ? new Date(order.deliveredAt).toLocaleDateString(
                                  "en-IN"
                                )
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === "performance" && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-base font-semibold text-slate-900">
                Monthly Performance
              </h2>
              <select
                value={perfMonth}
                onChange={(e) => setPerfMonth(parseInt(e.target.value))}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1).toLocaleString("en-IN", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={perfYear}
                onChange={(e) => setPerfYear(parseInt(e.target.value))}
                min={2020}
                max={2030}
                className="w-24 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {perfLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !performance ? (
              <div className="bg-white rounded-xl border border-slate-200 py-16 text-center text-slate-400">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No performance data for this period.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Target vs Actual */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 sm:col-span-2 lg:col-span-3">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">
                    Sales Performance
                  </h3>
                  <div className="flex items-end gap-6">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Target</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {formatCurrency(performance.target)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">
                        Actual Sales
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          performance.actualSales >= performance.target
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(performance.actualSales)}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-1">Achievement</p>
                      <p className="text-base font-semibold text-slate-700">
                        {performance.target > 0
                          ? (
                              (performance.actualSales / performance.target) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                  {/* visual bar */}
                  <div className="mt-4">
                    <div className="w-full bg-slate-100 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          performance.actualSales >= performance.target
                            ? "bg-green-500"
                            : "bg-blue-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            performance.target > 0
                              ? (performance.actualSales / performance.target) *
                                  100
                              : 0,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <p className="text-xs text-slate-500 mb-1">Open Orders</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {performance.openOrders}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <p className="text-xs text-slate-500 mb-1">
                    Pending Payments
                  </p>
                  <p className="text-2xl font-bold text-amber-600">
                    {formatCurrency(performance.pendingPayments)}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <p className="text-xs text-slate-500 mb-1">
                    Incentives Earned
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(performance.incentivesEarned)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
