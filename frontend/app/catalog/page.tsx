"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Product, SearchRequest } from "@/types/catalog";
import { useDynamicCatalog } from "@/hooks/useDynamicCatalog";
import TableFilterPanel, { TableFilters } from "@/components/catalog/TableFilterPanel";
import DynamicProductTable from "@/components/catalog/DynamicProductTable";
import DynamicProductModal from "@/components/catalog/DynamicProductModal";
import QuickEnableInventoryModal from "@/components/catalog/QuickEnableInventoryModal";
import { Pagination } from "@/components/common/Pagination";
import { usePermissionContext } from "@/providers/PermissionProvider";
import { Search, Upload, Plus, Info, ShieldAlert, Trash2, X, Zap } from "lucide-react";
import { api } from "@/lib/api-client";

export default function CatalogPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(500);
  const [keyword, setKeyword] = useState("");
  const [tableFilters, setTableFilters] = useState<TableFilters>({});

  // Inventory status cache
  const [inventoryStatuses, setInventoryStatuses] = useState<Record<string, any>>({});
  const [loadingInventoryStatuses, setLoadingInventoryStatuses] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [hardDelete, setHardDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkHardDelete, setBulkHardDelete] = useState(false);
  const [quickEnableModalOpen, setQuickEnableModalOpen] = useState(false);

  const {
    searchProducts,
    updateProduct,
    deleteProduct,
    bulkDeleteProducts,
    loading,
    error: apiError,
  } = useDynamicCatalog();
  const { canAccessModule, loading: permissionsLoading } = usePermissionContext();

  // Admin-only gate
  const isAdmin = canAccessModule("ADMINISTRATION");

  useEffect(() => {
    performSearch();
  }, [currentPage, pageSize]);

  const performSearch = async () => {
    try {
      const request: SearchRequest = {
        keyword: keyword || undefined,
        page: currentPage - 1,
        size: pageSize,
        sortBy: "createdAt",
        sortDirection: "DESC",
      };

      const result = await searchProducts(request);
      setProducts(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      setSelectedIds(new Set());

      // Fetch inventory statuses in bulk
      if (result.content.length > 0) {
        fetchBulkInventoryStatus(result.content.map((p) => p.id));
      }
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const fetchBulkInventoryStatus = async (productIds: string[]) => {
    try {
      // Set loading flag to prevent individual badge fetches
      setLoadingInventoryStatuses(true);

      const statusMap = await api.post<Record<string, any>>(
        "/catalog/inventory/status/bulk",
        productIds
      );
      setInventoryStatuses(statusMap || {});
    } catch (error) {
      console.error("Failed to fetch bulk inventory status:", error);
      setInventoryStatuses({});
    } finally {
      // Clear loading flag once bulk fetch is complete
      setLoadingInventoryStatuses(false);
    }
  };

  // Apply table-level filters
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Product name filter
    if (tableFilters.productName) {
      const searchTerm = tableFilters.productName.toLowerCase();
      filtered = filtered.filter((p) => p.displayName?.toLowerCase().includes(searchTerm));
    }

    // Category filter
    if (tableFilters.category) {
      filtered = filtered.filter((p) => p.category === tableFilters.category);
    }

    // Inventory status filter
    if (tableFilters.inventoryStatus) {
      filtered = filtered.filter((p) => {
        const status = inventoryStatuses[p.id];

        switch (tableFilters.inventoryStatus) {
          case "tracked":
            return status?.inventoryTracked === true;
          case "not-tracked":
            return !status?.inventoryTracked;
          case "in-stock":
            return status?.inventoryTracked && !status?.isOutOfStock && !status?.isLowStock;
          case "low-stock":
            return status?.inventoryTracked && status?.isLowStock === true;
          case "out-of-stock":
            return status?.inventoryTracked && status?.isOutOfStock === true;
          default:
            return true;
        }
      });
    }

    // Attribute filters
    if (tableFilters.attributes && Object.keys(tableFilters.attributes).length > 0) {
      filtered = filtered.filter((p) => {
        if (!p.attributes || !Array.isArray(p.attributes)) return false;

        // Check if product has ALL the filtered attributes with matching values
        return Object.entries(tableFilters.attributes!).every(([filterKey, filterValue]) => {
          return p.attributes.some(
            (attr: any) => attr.key === filterKey && attr.value === filterValue
          );
        });
      });
    }

    return filtered;
  }, [products, tableFilters, inventoryStatuses]);

  const handleSearch = () => {
    setCurrentPage(1);
    performSearch();
  };

  // ---------- Action handlers ----------

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setModalMode("view");
    setModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleSave = async (data: { displayName: string; attributes: Product["attributes"] }) => {
    if (!selectedProduct) return;
    try {
      await updateProduct(selectedProduct.id, data);
      setModalOpen(false);
      setSelectedProduct(null);
      performSearch(); // refresh list
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const handleDeleteClick = (product: Product) => {
    setDeleteTarget(product);
    setHardDelete(false);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id, hardDelete);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      performSearch();
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setDeleting(false);
    }
  };

  // ---------- Bulk delete handlers ----------

  const handleBulkDeleteClick = () => {
    setBulkHardDelete(false);
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    try {
      await bulkDeleteProducts(Array.from(selectedIds), bulkHardDelete);
      setBulkDeleteDialogOpen(false);
      setSelectedIds(new Set());
      performSearch();
    } catch (error) {
      console.error("Bulk delete failed:", error);
    } finally {
      setDeleting(false);
    }
  };

  // ---------- Bulk enable inventory handler ----------

  const handleBulkEnableInventory = () => {
    setQuickEnableModalOpen(true);
  };

  const handleQuickEnableSuccess = () => {
    setSelectedIds(new Set());
    performSearch();
  };

  // Permission loading state
  if (permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-slate-400 text-sm">Loading...</span>
      </div>
    );
  }

  // Admin-only gate
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-slate-500 max-w-sm">
            You do not have administrator privileges to access the catalog management page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dynamic Catalog</h1>
              <p className="text-sm text-slate-500">Explore products with flexible attributes.</p>
            </div>
            <button
              onClick={() => router.push("/catalog/upload")}
              className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
            >
              <Upload className="h-4 w-4" />
              Upload Products
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in-up">
        {/* Upload Instructions Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-5 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Info className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-blue-900 mb-3">
                📋 Catalog & Inventory Setup Guide
              </h3>

              {/* Step by Step */}
              <div className="space-y-3 mb-4">
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <p className="text-sm font-semibold text-blue-900 mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold mr-2">
                      1
                    </span>
                    Excel Upload - Basic Catalog (Mandatory)
                  </p>
                  <div className="ml-7 space-y-1">
                    <p className="text-xs text-blue-800">
                      <strong>Required columns:</strong>
                      <code className="ml-1 px-1.5 py-0.5 bg-blue-50 rounded text-xs font-mono">
                        ProductName
                      </code>
                      <code className="ml-1 px-1.5 py-0.5 bg-blue-50 rounded text-xs font-mono">
                        Unit
                      </code>
                      <code className="ml-1 px-1.5 py-0.5 bg-blue-50 rounded text-xs font-mono">
                        Description
                      </code>
                      <code className="ml-1 px-1.5 py-0.5 bg-blue-50 rounded text-xs font-mono">
                        UnitPrice
                      </code>
                      <code className="ml-1 px-1.5 py-0.5 bg-blue-50 rounded text-xs font-mono">
                        HsnCode
                      </code>
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-indigo-100">
                  <p className="text-sm font-semibold text-indigo-900 mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold mr-2">
                      2
                    </span>
                    Auto Inventory Creation (Optional - Add these columns)
                  </p>
                  <div className="ml-7 space-y-1">
                    <p className="text-xs text-indigo-800">
                      <strong>Add these columns to auto-enable inventory:</strong>
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-indigo-700 mt-1">
                      <div>
                        • <code className="px-1.5 py-0.5 bg-indigo-50 rounded font-mono">SKU</code>{" "}
                        (auto-generated if empty)
                      </div>
                      <div>
                        •{" "}
                        <code className="px-1.5 py-0.5 bg-indigo-50 rounded font-mono">
                          InitialStock
                        </code>{" "}
                        (default: 0)
                      </div>
                      <div>
                        •{" "}
                        <code className="px-1.5 py-0.5 bg-indigo-50 rounded font-mono">
                          Warehouse
                        </code>{" "}
                        (code/name, uses default if empty)
                      </div>
                      <div>
                        •{" "}
                        <code className="px-1.5 py-0.5 bg-indigo-50 rounded font-mono">
                          MinStockLevel
                        </code>{" "}
                        (default: 10)
                      </div>
                      <div>
                        •{" "}
                        <code className="px-1.5 py-0.5 bg-indigo-50 rounded font-mono">
                          ReorderLevel
                        </code>{" "}
                        (default: 20)
                      </div>
                    </div>
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                      <p className="text-xs text-green-800">
                        <strong>💰 UnitPrice Auto-Mapping:</strong> Your{" "}
                        <code className="px-1 py-0.5 bg-white rounded font-mono text-green-700">
                          UnitPrice
                        </code>{" "}
                        is automatically mapped to Base Price in inventory - both auto and manual
                        enable!
                      </p>
                    </div>
                    <p className="text-xs text-indigo-600 mt-2 italic">
                      ✨ If <strong>any</strong> inventory column is present, inventory will be
                      auto-enabled with smart defaults!
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <p className="text-sm font-semibold text-green-900 mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-600 text-white text-xs font-bold mr-2">
                      3
                    </span>
                    Manual Bulk Enable (After Upload)
                  </p>
                  <div className="ml-7">
                    <p className="text-xs text-green-800">
                      Select products → Click{" "}
                      <strong className="text-green-700">"Enable Inventory"</strong> → Configure →
                      Done!
                    </p>
                  </div>
                </div>
              </div>

              {/* Example Format */}
              <details className="bg-white rounded-lg p-3 border border-slate-200">
                <summary className="text-xs font-semibold text-slate-700 cursor-pointer hover:text-slate-900">
                  📄 View Excel Sample Format
                </summary>
                <div className="mt-2 overflow-x-auto">
                  <table className="text-xs border-collapse w-full">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-300 px-2 py-1 text-left">
                          ProductName*
                        </th>
                        <th className="border border-slate-300 px-2 py-1 text-left">Unit*</th>
                        <th className="border border-slate-300 px-2 py-1 text-left">
                          Description*
                        </th>
                        <th className="border border-slate-300 px-2 py-1 text-left">UnitPrice*</th>
                        <th className="border border-slate-300 px-2 py-1 text-left">HsnCode*</th>
                        <th className="border border-slate-300 px-2 py-1 text-left bg-indigo-50">
                          SKU
                        </th>
                        <th className="border border-slate-300 px-2 py-1 text-left bg-indigo-50">
                          InitialStock
                        </th>
                        <th className="border border-slate-300 px-2 py-1 text-left bg-indigo-50">
                          Warehouse
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 px-2 py-1">Dell Laptop</td>
                        <td className="border border-slate-300 px-2 py-1">Piece</td>
                        <td className="border border-slate-300 px-2 py-1">XPS 15</td>
                        <td className="border border-slate-300 px-2 py-1">75000</td>
                        <td className="border border-slate-300 px-2 py-1">8471</td>
                        <td className="border border-slate-300 px-2 py-1 bg-indigo-50">LAP-001</td>
                        <td className="border border-slate-300 px-2 py-1 bg-indigo-50">50</td>
                        <td className="border border-slate-300 px-2 py-1 bg-indigo-50">MAIN</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-xs text-slate-600 mt-2">
                    <strong>*</strong> = Mandatory | Indigo columns = Optional (for auto-inventory)
                  </p>
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by keyword..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Filter Panel */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <TableFilterPanel
              products={products}
              inventoryStatuses={inventoryStatuses}
              onFiltersChange={setTableFilters}
            />
          </div>

          {/* Results */}
          <div className="flex-1 w-full min-w-0">
            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-4 text-sm">
                Error: {apiError}
              </div>
            )}

            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-slate-500 font-medium">
                Showing {filteredProducts.length} of {totalElements} products
              </div>
              {Object.keys(tableFilters).length > 0 && (
                <div className="text-xs text-blue-600">
                  {Object.keys(tableFilters).length} filter
                  {Object.keys(tableFilters).length > 1 ? "s" : ""} active
                </div>
              )}
            </div>

            <DynamicProductTable
              products={filteredProducts}
              selectedIds={selectedIds}
              inventoryStatuses={inventoryStatuses}
              loadingInventoryStatuses={loadingInventoryStatuses}
              onSelectionChange={setSelectedIds}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />

            {totalElements > 0 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalElements={totalElements}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* View / Edit Modal */}
      <DynamicProductModal
        product={selectedProduct}
        mode={modalMode}
        open={modalOpen}
        saving={loading}
        onClose={() => {
          setModalOpen(false);
          setSelectedProduct(null);
        }}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteDialogOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-fade-in-up">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Product</h3>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteTarget.displayName}</span>?
            </p>

            {/* Soft vs Hard toggle */}
            <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="deleteType"
                  checked={!hardDelete}
                  onChange={() => setHardDelete(false)}
                  className="mt-0.5 accent-primary"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Soft Delete</p>
                  <p className="text-xs text-slate-500">
                    Product will be hidden but can be recovered later.
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="deleteType"
                  checked={hardDelete}
                  onChange={() => setHardDelete(true)}
                  className="mt-0.5 accent-red-600"
                />
                <div>
                  <p className="text-sm font-semibold text-red-700">Permanent Delete</p>
                  <p className="text-xs text-slate-500">
                    Product will be permanently removed and cannot be recovered.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className={`px-5 py-2 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  hardDelete
                    ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/25"
                    : "bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-600/25"
                }`}
              >
                {deleting ? "Deleting..." : hardDelete ? "Permanently Delete" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      {bulkDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setBulkDeleteDialogOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-fade-in-up">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Bulk Delete Products</h3>
            <p className="text-sm text-slate-600 mb-4">
              You are about to delete{" "}
              <span className="font-semibold text-slate-900">{selectedIds.size} products</span>.
              This action cannot be easily undone.
            </p>

            {/* Soft vs Hard toggle */}
            <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="bulkDeleteType"
                  checked={!bulkHardDelete}
                  onChange={() => setBulkHardDelete(false)}
                  className="mt-0.5 accent-primary"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Soft Delete</p>
                  <p className="text-xs text-slate-500">
                    Products will be hidden but can be recovered later.
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="bulkDeleteType"
                  checked={bulkHardDelete}
                  onChange={() => setBulkHardDelete(true)}
                  className="mt-0.5 accent-red-600"
                />
                <div>
                  <p className="text-sm font-semibold text-red-700">Permanent Delete</p>
                  <p className="text-xs text-slate-500">
                    Products will be permanently removed and cannot be recovered.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setBulkDeleteDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkDelete}
                disabled={deleting}
                className={`px-5 py-2 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  bulkHardDelete
                    ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/25"
                    : "bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-600/25"
                }`}
              >
                {deleting
                  ? "Deleting..."
                  : bulkHardDelete
                    ? `Permanently Delete ${selectedIds.size}`
                    : `Delete ${selectedIds.size}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Bar — floating at bottom when items selected */}
      {selectedIds.size > 0 &&
        (() => {
          // Check if ALL selected products are not tracked
          const allNotTracked = Array.from(selectedIds).every(
            (id) => !inventoryStatuses[id]?.inventoryTracked
          );

          return (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-fade-in-up">
              <div className="bg-slate-900 text-white rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedIds.size} product{selectedIds.size > 1 ? "s" : ""} selected
                </span>
                <div className="h-5 w-px bg-slate-600" />
                {/* Only show Enable Inventory if ALL selected products are not tracked */}
                {allNotTracked && (
                  <button
                    onClick={handleBulkEnableInventory}
                    className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors"
                  >
                    <Zap className="w-4 h-4" />
                    Enable Inventory
                  </button>
                )}
                <button
                  onClick={handleBulkDeleteClick}
                  className="flex items-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  title="Clear selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })()}

      {/* Quick Enable Inventory Modal */}
      {quickEnableModalOpen && (
        <QuickEnableInventoryModal
          isOpen={quickEnableModalOpen}
          onClose={() => setQuickEnableModalOpen(false)}
          products={filteredProducts.filter((p) => selectedIds.has(p.id))}
          onSuccess={handleQuickEnableSuccess}
        />
      )}
    </div>
  );
}
