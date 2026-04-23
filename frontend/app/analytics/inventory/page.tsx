"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import { showToast } from "@/lib/toast";

interface DeadStockItem {
  productId: string;
  daysSinceLastMovement: number;
  lastMovedAt: string;
}

interface DeadStockData {
  deadStock90Days: DeadStockItem[];
  deadStock180Days: DeadStockItem[];
  deadStock360Days: DeadStockItem[];
  totalDeadStockItems: number;
}

interface ReorderItem {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  reorderPoint: number;
  suggestedReorderQty: number;
  partCategory: string;
  vendorId: string;
}

interface TopConsumedItem {
  productId: string;
  totalConsumed: number;
}

type Tab = "deadstock" | "reorder" | "top-consumed";

function formatDate(dt: string) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function DeadStockSection({
  title,
  items,
  colorClass,
  badgeBg,
}: {
  title: string;
  items: DeadStockItem[];
  colorClass: string;
  badgeBg: string;
}) {
  return (
    <div className={`border-l-4 ${colorClass} bg-white rounded-xl shadow-sm overflow-hidden`}>
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <span className={`${badgeBg} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>
          {items.length} items
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-center text-slate-400 text-sm py-6">No items</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-2">
                  Product ID
                </th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase px-4 py-2">
                  Days Inactive
                </th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase px-4 py-2">
                  Last Moved
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.productId} className="border-t border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-2 font-mono text-xs text-slate-700">{item.productId}</td>
                  <td className="px-4 py-2 text-right font-semibold text-slate-800">
                    {item.daysSinceLastMovement}
                  </td>
                  <td className="px-4 py-2 text-right text-slate-500">
                    {formatDate(item.lastMovedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function InventoryAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("deadstock");
  const [deadStock, setDeadStock] = useState<DeadStockData | null>(null);
  const [reorder, setReorder] = useState<ReorderItem[]>([]);
  const [topConsumed, setTopConsumed] = useState<TopConsumedItem[]>([]);
  const [loading, setLoading] = useState<Record<Tab, boolean>>({
    deadstock: false,
    reorder: false,
    "top-consumed": false,
  });

  const fetchDeadStock = useCallback(async () => {
    if (deadStock) return;
    setLoading((l) => ({ ...l, deadstock: true }));
    try {
      const res = await api.get<DeadStockData>("/analytics/service/inventory/dead-stock");
      setDeadStock(res);
    } catch {
      showToast.error("Failed to load dead stock data");
    } finally {
      setLoading((l) => ({ ...l, deadstock: false }));
    }
  }, [deadStock]);

  const fetchReorder = useCallback(async () => {
    if (reorder.length > 0) return;
    setLoading((l) => ({ ...l, reorder: true }));
    try {
      const res = await api.get<ReorderItem[]>("/analytics/service/inventory/reorder");
      setReorder(res);
    } catch {
      showToast.error("Failed to load reorder recommendations");
    } finally {
      setLoading((l) => ({ ...l, reorder: false }));
    }
  }, [reorder]);

  const fetchTopConsumed = useCallback(async () => {
    if (topConsumed.length > 0) return;
    setLoading((l) => ({ ...l, "top-consumed": true }));
    try {
      const res = await api.get<TopConsumedItem[]>(
        "/analytics/service/inventory/top-consumed?limit=20"
      );
      setTopConsumed(res);
    } catch {
      showToast.error("Failed to load top consumed data");
    } finally {
      setLoading((l) => ({ ...l, "top-consumed": false }));
    }
  }, [topConsumed]);

  useEffect(() => {
    if (activeTab === "deadstock") fetchDeadStock();
    if (activeTab === "reorder") fetchReorder();
    if (activeTab === "top-consumed") fetchTopConsumed();
  }, [activeTab, fetchDeadStock, fetchReorder, fetchTopConsumed]);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "deadstock", label: "Dead Stock", icon: "warning" },
    { key: "reorder", label: "Reorder Recommendations", icon: "shopping_cart" },
    { key: "top-consumed", label: "Top Consumed", icon: "trending_up" },
  ];

  const isLoading = loading[activeTab];
  const maxConsumed =
    topConsumed.length > 0 ? Math.max(...topConsumed.map((i) => i.totalConsumed), 1) : 1;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Inventory Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Dead stock, reorder recommendations, and consumption trends
        </p>
      </div>

      {/* Summary badges (from dead stock) */}
      {deadStock && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border-t-4 border-yellow-400">
            <p className="text-2xl font-bold text-slate-800">{deadStock.deadStock90Days.length}</p>
            <p className="text-xs text-slate-500 mt-1">90+ Day Inactive</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border-t-4 border-orange-400">
            <p className="text-2xl font-bold text-slate-800">{deadStock.deadStock180Days.length}</p>
            <p className="text-xs text-slate-500 mt-1">180+ Day Inactive</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border-t-4 border-red-500">
            <p className="text-2xl font-bold text-slate-800">{deadStock.deadStock360Days.length}</p>
            <p className="text-xs text-slate-500 mt-1">360+ Day Inactive</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border-t-4 border-slate-400">
            <p className="text-2xl font-bold text-slate-800">{deadStock.totalDeadStockItems}</p>
            <p className="text-xs text-slate-500 mt-1">Total Dead Stock</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <span className="material-symbols-outlined animate-spin text-4xl text-blue-500">
                progress_activity
              </span>
            </div>
          ) : (
            <>
              {/* Dead Stock Tab */}
              {activeTab === "deadstock" && deadStock && (
                <div className="space-y-5">
                  <DeadStockSection
                    title="90+ Days Inactive"
                    items={deadStock.deadStock90Days}
                    colorClass="border-yellow-400"
                    badgeBg="bg-yellow-500"
                  />
                  <DeadStockSection
                    title="180+ Days Inactive"
                    items={deadStock.deadStock180Days}
                    colorClass="border-orange-400"
                    badgeBg="bg-orange-500"
                  />
                  <DeadStockSection
                    title="360+ Days Inactive"
                    items={deadStock.deadStock360Days}
                    colorClass="border-red-500"
                    badgeBg="bg-red-600"
                  />
                </div>
              )}

              {/* Reorder Tab */}
              {activeTab === "reorder" && (
                <>
                  {reorder.length === 0 ? (
                    <p className="text-center text-slate-400 py-8">No reorder recommendations</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">
                              Product Name
                            </th>
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">
                              SKU
                            </th>
                            <th className="text-right text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">
                              Current Stock
                            </th>
                            <th className="text-right text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">
                              Reorder Point
                            </th>
                            <th className="text-right text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">
                              Suggested Qty
                            </th>
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">
                              Category
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {reorder.map((item) => {
                            const critical = item.currentStock <= item.reorderPoint * 0.5;
                            return (
                              <tr
                                key={item.productId}
                                className="border-b border-slate-50 hover:bg-slate-50"
                              >
                                <td
                                  className={`px-3 py-2.5 font-medium ${critical ? "text-red-600" : "text-slate-800"}`}
                                >
                                  {item.productName}
                                </td>
                                <td className="px-3 py-2.5 font-mono text-xs text-slate-500">
                                  {item.sku}
                                </td>
                                <td
                                  className={`px-3 py-2.5 text-right font-semibold ${critical ? "text-red-600" : "text-slate-800"}`}
                                >
                                  {item.currentStock}
                                  {critical && (
                                    <span className="material-symbols-outlined text-xs text-red-500 ml-1 align-middle">
                                      warning
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-right text-slate-600">
                                  {item.reorderPoint}
                                </td>
                                <td className="px-3 py-2.5 text-right font-semibold text-blue-600">
                                  {item.suggestedReorderQty}
                                </td>
                                <td className="px-3 py-2.5 text-slate-500 text-xs">
                                  {item.partCategory || "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* Top Consumed Tab */}
              {activeTab === "top-consumed" && (
                <>
                  {topConsumed.length === 0 ? (
                    <p className="text-center text-slate-400 py-8">No consumption data</p>
                  ) : (
                    <div className="space-y-3">
                      {topConsumed.map((item, idx) => {
                        const pct = Math.round((item.totalConsumed / maxConsumed) * 100);
                        return (
                          <div key={item.productId} className="flex items-center gap-4">
                            <span className="w-7 text-right text-xs font-bold text-slate-400">
                              #{idx + 1}
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-slate-700 font-mono">
                                  {item.productId}
                                </span>
                                <span className="text-sm font-bold text-slate-800">
                                  {item.totalConsumed}
                                </span>
                              </div>
                              <div className="bg-slate-100 rounded-full h-2.5">
                                <div
                                  className="bg-blue-500 h-2.5 rounded-full transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
