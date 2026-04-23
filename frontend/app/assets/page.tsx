"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Asset, AssetStatus } from "@/types/field-service";
import { fieldService } from "@/lib/field-service";
import { authService } from "@/lib/auth";
import { EmptyState } from "@/components/EmptyState";
import ConfirmModal from "@/components/ConfirmModal";
import { showToast } from "@/lib/toast";
import {
  Search,
  Plus,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Laptop,
  XCircle,
  Calendar,
  Building2,
  Settings2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AssetsPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "ALL">("ALL");
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Sorting
  const [sortColumn, setSortColumn] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Selection & Actions
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadAssets();
  }, [router]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fieldService.getAllAssets();
      setAssets(data);
      setFilteredAssets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...assets];

    // Search filter
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.assetCode.toLowerCase().includes(term) ||
          a.serialNo.toLowerCase().includes(term) ||
          a.model.toLowerCase().includes(term) ||
          a.brand.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== "ALL") {
      result = result.filter((a) => a.status === statusFilter);
    }

    setFilteredAssets(result);
    setCurrentPage(1);
  }, [searchQuery, statusFilter, assets]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    let aValue: any = (a as any)[sortColumn] || "";
    let bValue: any = (b as any)[sortColumn] || "";

    if (sortColumn === "asset") {
      aValue = a.assetCode;
      bValue = b.assetCode;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedAssets.length / itemsPerPage);
  const paginatedAssets = sortedAssets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmDelete = (id: string) => {
    setAssetToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!assetToDelete) return;

    try {
      setActionLoading(true);
      await fieldService.deleteAsset(assetToDelete);
      showToast.success("Asset deleted successfully");
      setShowDeleteModal(false);
      setAssetToDelete(null);
      loadAssets();
    } catch {
      showToast.error("Failed to delete asset");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAssets(paginatedAssets.map((a) => a.id));
    } else {
      setSelectedAssets([]);
    }
  };

  const handleSelectAsset = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedAssets([...selectedAssets, id]);
    } else {
      setSelectedAssets(selectedAssets.filter((a) => a !== id));
    }
  };

  const getStatusBadge = (status: AssetStatus) => {
    switch (status) {
      case AssetStatus.ACTIVE:
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 uppercase text-[10px] font-bold">
            Active
          </Badge>
        );
      case AssetStatus.UNDER_REPAIR:
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-100 uppercase text-[10px] font-bold">
            Under Repair
          </Badge>
        );
      case AssetStatus.DECOMMISSIONED:
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-200 uppercase text-[10px] font-bold">
            Decommissioned
          </Badge>
        );
      case AssetStatus.IN_TRANSIT:
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-100 uppercase text-[10px] font-bold">
            In Transit
          </Badge>
        );
      case AssetStatus.SCRAPPED:
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-100 uppercase text-[10px] font-bold">
            Scrapped
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isAllSelected =
    paginatedAssets.length > 0 && selectedAssets.length === paginatedAssets.length;
  const isSomeSelected =
    selectedAssets.length > 0 && selectedAssets.length < paginatedAssets.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-slate-50 min-h-[calc(100vh-4rem)]">
        <div className="relative text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium tracking-tight">Loading assets inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-5 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Laptop className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Asset Registry</h1>
              </div>
              <p className="text-sm text-slate-500 font-medium">
                Manage equipment, serial numbers, and warranty tracking.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="hidden sm:flex gap-2 rounded-xl">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                onClick={() => router.push("/admin/settings/asset-categories")}
                variant="outline"
                className="flex gap-2 rounded-xl"
              >
                <Settings2 className="h-4 w-4" />
                Categories
              </Button>
              <Button
                onClick={() => router.push("/assets/new")}
                className="flex items-center gap-2 rounded-xl px-5 shadow-lg shadow-primary/25"
              >
                <Plus className="h-4 w-4" />
                New Asset
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Toolbar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 lg:p-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-4 w-full">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search code, serial, or model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                />
              </div>
              <div className="w-px h-8 bg-slate-200 hidden md:block"></div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium min-w-[160px]"
              >
                <option value="ALL">All Statuses</option>
                {Object.values(AssetStatus).map((status) => (
                  <option key={status} value={status}>
                    {status.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            {selectedAssets.length > 0 && (
              <div className="flex items-center gap-3 bg-primary/5 text-primary px-4 py-2 rounded-xl text-sm font-semibold animate-in fade-in zoom-in duration-200 border border-primary/10">
                <span>{selectedAssets.length} Selected</span>
                <div className="h-4 w-px bg-primary/20 mx-1"></div>
                <button
                  onClick={() => confirmDelete(selectedAssets[0])}
                  className="text-rose-600 hover:text-rose-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button onClick={() => setSelectedAssets([])} className="hover:underline">
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-center gap-3 shadow-sm animate-in shake-in">
            <XCircle className="h-5 w-5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Table Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-4 w-12">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isSomeSelected;
                        }}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 text-primary bg-white border-slate-300 rounded focus:ring-primary focus:ring-2 cursor-pointer transition-all"
                      />
                    </div>
                  </th>
                  {[
                    { key: "assetCode", label: "Asset ID" },
                    { key: "serialNo", label: "Serial No" },
                    { key: "brand", label: "Brand & Model" },
                    { key: "accountName", label: "Account" },
                    { key: "warrantyExpiry", label: "Warranty" },
                    { key: "status", label: "Status" },
                  ].map((col) => (
                    <th
                      key={col.key}
                      className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors group"
                      onClick={() => handleSort(col.key)}
                    >
                      <div className="flex items-center gap-2">
                        {col.label}
                        <ArrowUpDown
                          className={`h-3 w-3 transition-opacity ${sortColumn === col.key ? "text-primary" : "text-slate-300 opacity-0 group-hover:opacity-100"}`}
                        />
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedAssets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-20 text-center">
                      <EmptyState
                        icon="inventory"
                        title={searchQuery ? "No matching assets" : "Empty Registry"}
                        description={
                          searchQuery
                            ? "Try adjusting your search or filters."
                            : "Start tracking your equipment by adding your first asset."
                        }
                        action={
                          !searchQuery
                            ? { label: "Add Your First Asset", href: "/assets/new" }
                            : undefined
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      className="hover:bg-slate-50/80 transition-all group cursor-pointer border-l-2 border-transparent hover:border-primary/40"
                      onClick={() => router.push(`/assets/${asset.id}`)}
                    >
                      <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedAssets.includes(asset.id)}
                            onChange={(e) => handleSelectAsset(asset.id, e.target.checked)}
                            className="w-4 h-4 text-primary bg-white border-slate-300 rounded focus:ring-primary focus:ring-2 cursor-pointer transition-all"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-bold text-slate-900 font-mono tracking-tight group-hover:text-primary transition-colors">
                          {asset.assetCode}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-slate-600">
                        {asset.serialNo}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                            <Laptop className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 tracking-tight">
                              {asset.brand}
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium">{asset.model}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-sm font-medium text-slate-700">
                            {asset.accountName || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span
                            className={`text-sm font-medium ${
                              asset.warrantyExpiry && new Date(asset.warrantyExpiry) < new Date()
                                ? "text-rose-500 font-bold"
                                : "text-slate-600"
                            }`}
                          >
                            {asset.warrantyExpiry
                              ? new Date(asset.warrantyExpiry).toLocaleDateString()
                              : "No Warranty"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">{getStatusBadge(asset.status)}</td>
                      <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/assets/${asset.id}/edit`)}
                            className="h-8 w-8 p-0 hover:bg-white hover:text-primary shadow-sm"
                          >
                            <Settings2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDelete(asset.id)}
                            className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 shadow-sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {sortedAssets.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-6 py-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500 font-medium">
              Showing{" "}
              <span className="text-slate-900 font-bold">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="text-slate-900 font-bold">
                {Math.min(currentPage * itemsPerPage, sortedAssets.length)}
              </span>{" "}
              of <span className="text-slate-900 font-bold">{sortedAssets.length}</span> Assets
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-9 rounded-lg px-2 disabled:bg-slate-50 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center px-4 h-9 rounded-lg bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 min-w-[80px] justify-center">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-9 rounded-lg px-2 disabled:bg-slate-50 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Permanently Delete Asset"
        message="This will remove the asset from current tracking. All historical service data and contract linkages will eventually be affected. Do you wish to continue?"
        confirmLabel="Delete Asset"
        cancelLabel="Keep Asset"
        confirmButtonClass="bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-6"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        isLoading={actionLoading}
      />
    </div>
  );
}
