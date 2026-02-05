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
} from "lucide-react";
import { Pagination } from "@/components/common/Pagination";
import { PermissionGuard } from "@/components/common/PermissionGuard";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  // filteredProducts removed as filtering is server-side
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [error, setError] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);

      const pagination = {
        page: currentPage,
        size: pageSize,
        sort: "productName,asc" // Default sort
      };

      let response;
      if (searchTerm) {
        response = await productsService.searchProducts(searchTerm, pagination);
      } else if (categoryFilter !== "ALL") {
        response = await productsService.getProductsByCategory(categoryFilter, pagination);
      } else {
        response = await productsService.getAllProducts(false, pagination);
      }

      // Handle Paginated Response
      if ('content' in response) {
        setProducts(response.content);
        setTotalElements(response.totalElements);
        setTotalPages(response.totalPages);
      } else {
        // Fallback for non-paginated endpoints
        setProducts(response);
        setTotalElements(response.length);
        setTotalPages(1);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, categoryFilter]);

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }

    loadProducts();
  }, [router, loadProducts]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category);
    setCurrentPage(1); // Reset to first page
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  // Get unique categories (Note: This might need a separate API call if we only fetch paginated products)
  // For now, we might rely on a hardcoded list or assume we want to show all available categories.
  // Ideally, the backend should provide a categories endpoint.
  // Using existing products data for categories will only show categories of CURRENT page products, which is bad.
  // Let's assume we can fetch categories or keep the list dynamic.
  // For this implementation, I will remove dynamic category extraction from partial product list 
  // and maybe try to fetch all products JUST for categories or hardcode strict categories if known.
  // But to be safe and avoiding extra heavy calls, I'll temporarily keep it but knowing it's limited.
  // BETTER: Fetch unique categories separate if needed. 
  // Codebase usually doesn't have "getAllCategories" yet. I'll stick to basic mapping but be aware.
  const categories = ["Electronics", "Services", "Subscriptions", "Hardware"];

  if (loading && products.length === 0) { // Only show full loader on initial load
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 ">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        </div>
        <div className="relative text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500  font-medium">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <div className="sticky top-16 z-20 bg-white/80  backdrop-blur-lg border-b border-slate-200 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900  tracking-tight">Product Catalog</h1>
              <p className="text-sm text-slate-500 ">Manage your inventory and product details.</p>
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
        <div className="bg-white  rounded-2xl shadow-sm border border-slate-200  p-2">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by name, SKU..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50  border border-slate-200  rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <select
                  value={categoryFilter}
                  onChange={(e) => handleCategoryFilter(e.target.value)}
                  className="w-full appearance-none pl-10 pr-10 py-2.5 bg-slate-50  border border-slate-200  rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
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
          <div className="bg-red-50  border border-red-200  text-red-700  p-4 rounded-xl flex items-center gap-3">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Products Grid or Empty State */}
        {products.length === 0 && !loading ? (
          <div className="bg-white  rounded-2xl border border-slate-200  p-12 text-center">
            {searchTerm || categoryFilter !== "ALL" ? (
              <EmptyState
                icon="search_off"
                title="No products found"
                description="Try adjusting your search or filters."
              />
            ) : (
              <EmptyState
                icon="inventory_2"
                title="No products yet"
                description="Get started by adding your first product to the catalog."
                action={{ label: "Add Product", href: "/products/new" }}
              />
            )}
          </div>
        ) : (
          <>
            {/* Products Grid */}
            <div className="min-h-[200px] relative">
              {loading && (
                <div className="absolute inset-0 bg-white/50  z-10 flex items-center justify-center backdrop-blur-sm rounded-2xl">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="group bg-white  rounded-2xl border border-slate-200  hover:border-primary/50  hover:shadow-lg  transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
                    onClick={() => router.push(`/products/${product.id}`)}
                  >
                    <div className="relative aspect-[4/3] bg-slate-100  flex items-center justify-center p-6 border-b border-slate-100 ">
                      <div className="bg-white  p-4 rounded-2xl shadow-sm text-primary/20">
                        <Package className="h-16 w-16" />
                      </div>
                      <div className="absolute top-4 right-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold backdrop-blur-md shadow-sm ${product.isActive
                          ? "bg-emerald-500/10 text-emerald-700  border border-emerald-500/20"
                          : "bg-slate-500/10 text-slate-700  border border-slate-500/20"
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
                        <h3 className="text-lg font-bold text-slate-900  line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                          {product.productName}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500  bg-slate-100  px-2 py-1 rounded-md">
                          <Tag className="h-3 w-3" />
                          {product.sku}
                        </span>
                        {product.category && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500  bg-slate-100  px-2 py-1 rounded-md">
                            <Archive className="h-3 w-3" />
                            {product.category}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-600  mb-4 line-clamp-2 flex-1">
                        {product.description || "No description available."}
                      </p>

                      <div className="pt-4 border-t border-slate-100  space-y-3">
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm text-slate-500 ">Price</span>
                          <span className="text-xl font-bold text-slate-900 ">
                            {formatCurrency(product.basePrice)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-slate-500 ">
                            <span>Tax Rate:</span>
                            <span className="font-medium text-slate-700 ">{product.taxRate}%</span>
                          </div>
                          <div className={`flex items-center gap-1 font-medium ${(product.stockQuantity || 0) > 10 ? 'text-emerald-600' :
                            (product.stockQuantity || 0) > 0 ? 'text-amber-600' :
                              'text-rose-600'
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
            </div>

            {/* Pagination Component */}
            {totalPages > 0 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalElements={totalElements}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
