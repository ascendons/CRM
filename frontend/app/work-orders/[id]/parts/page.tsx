"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { WorkOrder, AssetCategory } from "@/types/field-service";
import { fieldService } from "@/lib/field-service";
import { productsService } from "@/lib/products";
import { authService } from "@/lib/auth";
import { ProductResponse } from "@/types/product";
import { showToast } from "@/lib/toast";
import {
  ChevronLeft,
  Plus,
  Trash2,
  Save,
  Package,
  Search,
  Loader2,
  Inbox,
  LayoutGrid,
  Info,
  X,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function WorkOrderPartsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [products, setProductResponses] = useState<ProductResponse[]>([]);
  const [partsUsed, setPartsUsed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadData();
  }, [id, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [orderData, productsData] = await Promise.all([
        fieldService.getWorkOrderById(id),
        productsService.getAllProducts(),
      ]);
      setOrder(orderData);
      setProductResponses(Array.isArray(productsData) ? productsData : []);
      setPartsUsed(orderData.partsUsed || []);
    } catch (err) {
      showToast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  const addPart = (product: ProductResponse) => {
    const existing = partsUsed.find((p) => p.partId === product.id);
    if (existing) {
      updatePart(product.id, { qty: (existing.qty || 0) + 1 });
    } else {
      setPartsUsed([
        ...partsUsed,
        {
          partId: product.id,
          qty: 1,
          serialNo: "",
          _name: product.productName,
          _sku: product.sku,
        },
      ]);
    }
    setSearchQuery("");
  };

  const updatePart = (partId: string, updates: any) => {
    setPartsUsed(partsUsed.map((p) => (p.partId === partId ? { ...p, ...updates } : p)));
  };

  const removePart = (partId: string) => {
    setPartsUsed(partsUsed.filter((p) => p.partId !== partId));
  };

  const saveParts = async () => {
    setSaving(true);
    try {
      await fieldService.updateWorkOrder(id, { partsUsed });
      showToast.success("Consumption record updated");
      router.push(`/work-orders/${id}`);
    } catch (err) {
      showToast.error("Failed to sync consumption data");
    } finally {
      setSaving(false);
    }
  };

  const filteredProductResponses =
    searchQuery.length > 1
      ? products
          .filter(
            (p) =>
              p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 5)
      : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-slate-50 min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-slate-500 font-medium tracking-tight">Accessing part registry...</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-5">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="rounded-full h-11 w-11 hover:bg-slate-100 border border-slate-100"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </Button>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                  Consumption Log
                </h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {order.woNumber} • Spare Parts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl h-11 w-11 border-slate-200"
              >
                <Printer className="h-4 w-4" />
              </Button>
              <Button
                onClick={saveParts}
                disabled={saving}
                className="rounded-2xl h-11 px-6 font-black shadow-xl shadow-primary/20 bg-slate-900 text-white"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Finalize Log
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-10">
          {/* Add Parts Search */}
          <div className="relative group">
            <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white p-2">
              <CardContent className="p-2">
                <div className="relative">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
                  <Input
                    placeholder="Search components by SKU, Brand or Series..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-16 pl-[72px] pr-8 rounded-[2rem] border-none shadow-none bg-slate-50 focus:bg-white focus:ring-primary/20 text-lg font-bold placeholder:text-slate-300"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Search Results Dropdown */}
            {filteredProductResponses.length > 0 && (
              <Card className="absolute top-24 left-0 right-0 z-50 rounded-[2rem] border-2 border-slate-100 shadow-2xl bg-white/95 backdrop-blur-xl overflow-hidden p-2">
                {filteredProductResponses.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addPart(p)}
                    className="w-full flex items-center gap-4 p-5 hover:bg-slate-50 rounded-2xl transition-all text-left group"
                  >
                    <div className="h-12 w-12 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                      <Package className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-900 tracking-tight capitalize">
                        {p.productName}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {p.sku || "No SKU"}
                      </p>
                    </div>
                    <Plus className="h-5 w-5 text-slate-300 group-hover:text-primary" />
                  </button>
                ))}
              </Card>
            )}
          </div>

          {/* Consumption Table */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-950 flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-primary" />
                  Consumed Units
                </Label>
                <Badge className="bg-slate-200 text-slate-600 border-none rounded-lg text-[10px] font-black px-2">
                  {partsUsed.length} Lines
                </Badge>
              </div>
            </div>

            {partsUsed.length === 0 ? (
              <div className="bg-white rounded-[3rem] p-24 text-center border-2 border-dashed border-slate-200">
                <div className="h-24 w-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8">
                  <Inbox className="h-10 w-10 text-slate-200" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                  No Parts Recorded
                </h3>
                <p className="text-slate-500 font-medium max-w-xs mx-auto mt-2">
                  Inventory consumption must be logged for accurate costing and stock levels.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {partsUsed.map((p, idx) => {
                  const product = products.find((prod) => prod.id === p.partId);
                  return (
                    <Card
                      key={idx}
                      className="rounded-[2rem] border-none shadow-lg bg-white overflow-hidden group"
                    >
                      <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row items-center gap-8">
                        <div className="h-16 w-16 bg-slate-50 rounded-[20px] border border-slate-100 flex items-center justify-center text-slate-300 shrink-0">
                          <Package className="h-8 w-8" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-black text-slate-900 tracking-tight truncate line-clamp-1">
                            {product?.productName || p._name || "Unknown Part"}
                          </h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {product?.sku || p._sku || "SKU-000"}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-6">
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black text-slate-400 uppercase px-1">
                              Quantity
                            </Label>
                            <div className="flex items-center bg-slate-50 rounded-xl border border-slate-100 overflow-hidden h-11">
                              <button
                                onClick={() =>
                                  updatePart(p.partId, { qty: Math.max(1, (p.qty || 1) - 1) })
                                }
                                className="px-3 hover:bg-slate-200 transition-colors"
                              >
                                <X className="h-3 w-3 text-slate-400 rotate-45" />
                              </button>
                              <input
                                type="number"
                                value={p.qty}
                                onChange={(e) =>
                                  updatePart(p.partId, { qty: parseInt(e.target.value) || 1 })
                                }
                                className="w-12 bg-transparent border-none text-center font-black text-slate-900 focus:ring-0 text-sm"
                              />
                              <button
                                onClick={() => updatePart(p.partId, { qty: (p.qty || 1) + 1 })}
                                className="px-3 hover:bg-slate-200 transition-colors"
                              >
                                <Plus className="h-3 w-3 text-slate-400" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2 flex-1 md:flex-none">
                            <Label className="text-[9px] font-black text-slate-400 uppercase px-1">
                              Serial Number
                            </Label>
                            <Input
                              value={p.serialNo || ""}
                              onChange={(e) => updatePart(p.partId, { serialNo: e.target.value })}
                              placeholder="SN-12345..."
                              className="h-11 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs w-full md:w-48 px-4 focus:ring-primary/20"
                            />
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removePart(p.partId)}
                            className="rounded-xl h-11 w-11 hover:bg-rose-50 text-slate-200 hover:text-rose-500 transition-all active:scale-95"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Costing Warning */}
          <div className="p-8 bg-blue-50/50 rounded-[3rem] border-2 border-blue-100/50 flex flex-col md:flex-row items-center gap-6">
            <div className="h-14 w-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-500 shrink-0">
              <Info className="h-7 w-7" />
            </div>
            <div className="space-y-1 text-center md:text-left">
              <p className="text-sm font-black text-blue-900 uppercase italic tracking-tight">
                Stock Valuation & Costing
              </p>
              <p className="text-xs text-blue-700 font-medium leading-relaxed opacity-80">
                Recording consumption here will automatically deduct items from the assigned
                Warehouse{" "}
                {order.assignedEngineerIds?.length ? "of the lead engineer" : "Default Location"}{" "}
                and impact final billing.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
