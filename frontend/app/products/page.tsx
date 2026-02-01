"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { productsService } from "@/lib/products";
import { authService } from "@/lib/auth";
import { ProductResponse } from "@/types/product";
import { EmptyState } from "@/components/EmptyState";
import {
  Search,
  Plus,
  Filter,
  Package,
  Tag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Archive,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [error, setError] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }

    loadProducts();
  }, [router]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productsService.getAllProducts();
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = useCallback(() => {
    let filtered = [...products];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.productName.toLowerCase().includes(term) ||
          product.sku.toLowerCase().includes(term) ||
          (product.description && product.description.toLowerCase().includes(term)) ||
          (product.category && product.category.toLowerCase().includes(term))
      );
    }

    // Apply category filter
    if (categoryFilter !== "ALL") {
      filtered = filtered.filter((product) => product.category === categoryFilter);
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, products]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category);
  };

  const getPaginatedProducts = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  // Get unique categories
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        </div>
        <div className="relative text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Product Catalog</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manage your inventory and product details.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/products/new")}
                className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in-up">
        {/* Toolbar */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-2">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by name, SKU..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <select
                  value={categoryFilter}
                  onChange={(e) => handleCategoryFilter(e.target.value)}
                  className="w-full appearance-none pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-xl flex items-center gap-3">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Products Grid or Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            {searchTerm || categoryFilter !== "ALL" ? (
              <EmptyState
                icon="search_off"
                title="No products found"
                description="Try adjusting your search or filters."
              />
            ) : (
              <EmptyState
                icon="inventory_2" // Using a material icon name supported by EmptyState if configured, else fallback
                title="No products yet"
                description="Get started by adding your first product to the catalog."
                action={{ label: "Add Product", href: "/products/new" }}
              />
            )}
          </div>
        ) : (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {getPaginatedProducts().map((product) => (
                <div
                  key={product.id}
                  className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-lg dark:hover:shadow-primary/10 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
                  onClick={() => router.push(`/products/${product.id}`)}
                >
                  <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center p-6 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm text-primary/20">
                      <Package className="h-16 w-16" />
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold backdrop-blur-md shadow-sm ${product.isActive
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/20"
                        }`}>
                        {product.isActive ? (
                          <> <CheckCircle2 className="h-3 w-3" /> Active </>
                        ) : (
                          <> <XCircle className="h-3 w-3" /> Inactive </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                        {product.productName}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">
                        <Tag className="h-3 w-3" />
                        {product.sku}
                      </span>
                      {product.category && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">
                          <Archive className="h-3 w-3" />
                          {product.category}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2 flex-1">
                      {product.description || "No description available."}
                    </p>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Price</span>
                        <span className="text-xl font-bold text-slate-900 dark:text-white">
                          {formatCurrency(product.basePrice)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <span>Tax Rate:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{product.taxRate}%</span>
                        </div>
                        <div className={`flex items-center gap-1 font-medium ${(product.stockQuantity || 0) > 10 ? 'text-emerald-600 dark:text-emerald-400' :
                          (product.stockQuantity || 0) > 0 ? 'text-amber-600 dark:text-amber-400' :
                            'text-rose-600 dark:text-rose-400'
                          }`}>
                          <span>{(product.stockQuantity || 0) > 0 ? "In Stock:" : "Out of Stock"}</span>
                          <span>{product.stockQuantity || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Showing <span className="font-semibold text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> of <span className="font-semibold text-slate-900 dark:text-white">{filteredProducts.length}</span> results
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
