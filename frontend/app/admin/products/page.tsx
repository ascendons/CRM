"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Package, DollarSign, Tag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { productsService } from "@/lib/products";
import type { ProductResponse, ProductStatus } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import ConfirmModal from "@/components/ConfirmModal";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; productId: string | null }>({
    open: false,
    productId: null,
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, statusFilter, categoryFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productsService.getAllProducts();
      setProducts(Array.isArray(data) ? data : (data as any).content || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.productName.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query) ||
          (product.description && product.description.toLowerCase().includes(query)) ||
          product.category.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((product) => product.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((product) => product.category === categoryFilter);
    }

    setFilteredProducts(filtered);
  };

  const handleDeleteProduct = async () => {
    if (!deleteModal.productId) return;

    try {
      setDeleting(true);
      await productsService.deleteProduct(deleteModal.productId);
      toast.success("Product deleted successfully");
      setDeleteModal({ open: false, productId: null });
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: ProductStatus) => {
    const variants: Record<ProductStatus, { variant: any; label: string }> = {
      ACTIVE: { variant: "default", label: "Active" },
      DISCONTINUED: { variant: "secondary", label: "Discontinued" },
      OUT_OF_STOCK: { variant: "destructive", label: "Out of Stock" },
      DRAFT: { variant: "outline", label: "Draft" },
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const categories = Array.from(new Set(products.map((p) => p.category))).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            New Product
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, SKU, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
            <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description={
            searchQuery || statusFilter !== "all" || categoryFilter !== "all"
              ? "Try adjusting your filters"
              : "Get started by creating your first product"
          }
          action={undefined}
          customAction={
            !searchQuery && statusFilter === "all" && categoryFilter === "all" ? (
              <Button asChild>
                <Link href="/admin/products/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Product
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Tax Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => router.push(`/admin/products/${product.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-muted rounded">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.productName}
                            </div>
                            <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                          {product.category}
                        </div>
                        {product.subcategory && (
                          <div className="text-xs text-gray-500">{product.subcategory}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          {product.basePrice.toLocaleString()} {product.currency}
                        </div>
                        <div className="text-xs text-gray-500">per {product.unit}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.taxRate}% {product.taxType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.stockQuantity !== undefined && product.stockQuantity !== null ? (
                          <div className="text-sm">
                            <div className="text-gray-900">{product.stockQuantity} {product.unit}</div>
                            {product.minStockLevel && (
                              <div className="text-xs text-gray-500">
                                Min: {product.minStockLevel}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(product.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/products/${product.id}`);
                            }}
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/products/${product.id}/edit`);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteModal({ open: true, productId: product.id });
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onCancel={() => setDeleteModal({ open: false, productId: null })}
        onConfirm={handleDeleteProduct}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={deleting}
      />
    </div>
  );
}
