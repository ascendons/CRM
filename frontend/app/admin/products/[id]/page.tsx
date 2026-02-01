"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, Edit, Trash2, DollarSign, Tag, BarChart3 } from "lucide-react";
import Link from "next/link";
import { productsService } from "@/lib/products";
import type { ProductResponse } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const router = useRouter();
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await productsService.getProductById(params.id);
      setProduct(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch product");
      router.push("/admin/products");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await productsService.deleteProduct(params.id);
      toast.success("Product deleted successfully");
      router.push("/admin/products");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      ACTIVE: { variant: "default", label: "Active" },
      DISCONTINUED: { variant: "secondary", label: "Discontinued" },
      OUT_OF_STOCK: { variant: "destructive", label: "Out of Stock" },
      DRAFT: { variant: "outline", label: "Draft" },
    };

    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{product.productName}</h1>
              {getStatusBadge(product.status)}
            </div>
            <p className="text-muted-foreground">SKU: {product.sku} • ID: {product.productId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/products/${product.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={() => setDeleteModal(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Product Name</p>
              <p className="text-base">{product.productName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">SKU</p>
              <p className="text-base font-mono">{product.sku}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Product ID</p>
              <p className="text-base font-mono">{product.productId}</p>
            </div>
            {product.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-base">{product.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing & Tax */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing & Tax
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Base Price</p>
              <p className="text-2xl font-bold">
                {product.currency} {product.basePrice.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">per {product.unit}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tax</p>
              <p className="text-base">
                {product.taxRate}% {product.taxType}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Price with Tax</p>
              <p className="text-lg font-semibold">
                {product.currency}{" "}
                {(product.basePrice * (1 + product.taxRate / 100)).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Categorization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Categorization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Category</p>
              <p className="text-base">{product.category}</p>
            </div>
            {product.subcategory && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Subcategory</p>
                <p className="text-base">{product.subcategory}</p>
              </div>
            )}
            {product.tags && product.tags.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Inventory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {product.stockQuantity !== undefined && product.stockQuantity !== null ? (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Stock</p>
                  <p className="text-2xl font-bold">
                    {product.stockQuantity} {product.unit}
                  </p>
                </div>
                {product.minStockLevel !== undefined && product.minStockLevel !== null && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Minimum Stock Level</p>
                    <p className="text-base">
                      {product.minStockLevel} {product.unit}
                    </p>
                    {product.stockQuantity <= product.minStockLevel && (
                      <Badge variant="destructive" className="mt-1">
                        Low Stock Alert
                      </Badge>
                    )}
                  </div>
                )}
                {product.maxStockLevel !== undefined && product.maxStockLevel !== null && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Maximum Stock Level</p>
                    <p className="text-base">
                      {product.maxStockLevel} {product.unit}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">Inventory tracking not enabled for this product</p>
            )}
          </CardContent>
        </Card>

        {/* System Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-base">
                  {new Date(product.createdAt).toLocaleString()} by {product.createdByName}
                </p>
              </div>
              {product.lastModifiedAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Modified</p>
                  <p className="text-base">
                    {new Date(product.lastModifiedAt).toLocaleString()}
                    {product.lastModifiedByName && ` by ${product.lastModifiedByName}`}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        description={`Are you sure you want to delete "${product.productName}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
      />
    </div>
  );
}
