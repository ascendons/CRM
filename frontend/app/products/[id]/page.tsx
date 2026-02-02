"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProductResponse } from "@/types/product";
import { productsService } from "@/lib/products";
import { authService } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import ConfirmModal from "@/components/ConfirmModal";
import { PermissionGuard } from "@/components/common/PermissionGuard";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await productsService.getProductById(id);
      setProduct(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    try {
      setDeleteLoading(true);
      await productsService.deleteProduct(product.id);
      showToast.success("Product deleted successfully");
      router.push("/products");
    } catch (error: any) {
      if (error.response?.status === 400) {
        const message = error.response.data?.message;

        if (message?.includes('active proposal')) {
          showToast.error(
            <div>
              <p>{message}</p>
              <button
                onClick={() => router.push(`/proposals?productId=${product.id}`)}
                className="mt-2 text-xs bg-white text-red-600 px-2 py-1 rounded border border-red-200 hover:bg-red-50"
              >
                View Proposals
              </button>
            </div>
          );
        } else {
          showToast.error(message || "Failed to delete product");
        }
      } else {
        showToast.error(error.message || "Failed to delete product");
      }
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || "Product not found"}</p>
          <Link
            href="/products"
            className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const DetailSection = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );

  const DetailRow = ({
    label,
    value,
  }: {
    label: string;
    value: string | number | boolean | undefined | null;
  }) => (
    <div className="py-3 border-b border-gray-200 last:border-0">
      <dt className="text-sm font-medium text-gray-500 mb-1">{label}</dt>
      <dd className="text-sm text-gray-900">
        {value !== undefined && value !== null && value !== ""
          ? String(value)
          : "-"}
      </dd>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {product.productName}
                </h1>
                {product.isActive ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded-full">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-gray-600">SKU: {product.sku}</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/products"
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </Link>
              <PermissionGuard resource="PRODUCT" action="DELETE" fallback={null}>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </PermissionGuard>
              <Link
                href={`/products/${product.id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <DetailSection title="Basic Information">
              <dl>
                <DetailRow label="Product Name" value={product.productName} />
                <DetailRow label="SKU" value={product.sku} />
                <DetailRow label="Category" value={product.category} />
                <DetailRow label="Description" value={product.description} />
              </dl>
            </DetailSection>

            {/* Pricing */}
            <DetailSection title="Pricing">
              <dl>
                <DetailRow
                  label="Base Price"
                  value={formatCurrency(product.basePrice)}
                />
                <DetailRow label="Tax Rate" value={`${product.taxRate}%`} />
                {/* listPrice and discount removed as they don't exist on ProductResponse */
                }
              </dl>
            </DetailSection>

            {/* Inventory */}
            {product.stockQuantity !== undefined && (
              <DetailSection title="Inventory">
                <dl>
                  <DetailRow label="Stock Quantity" value={product.stockQuantity} />
                  <DetailRow label="Unit" value={product.unit} />
                  <DetailRow
                    label="Min Stock Level"
                    value={product.minStockLevel}
                  />
                  <DetailRow
                    label="Stock Status"
                    value={
                      product.stockQuantity > 10
                        ? "In Stock"
                        : product.stockQuantity > 0
                          ? "Low Stock"
                          : "Out of Stock"
                    }
                  />
                </dl>
              </DetailSection>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Summary */}
            <DetailSection title="Price Summary">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Base Price</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(product.basePrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Tax ({product.taxRate}%)
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(
                      (product.basePrice * product.taxRate) / 100
                    )}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <span className="text-base font-semibold text-gray-900">
                    Total Price
                  </span>
                  <span className="text-base font-bold text-blue-600">
                    {formatCurrency(
                      product.basePrice * (1 + product.taxRate / 100)
                    )}
                  </span>
                </div>
              </div>
            </DetailSection>

            {/* System Information */}
            <DetailSection title="System Information">
              <dl>
                <DetailRow
                  label="Product ID"
                  value={product.productId}
                />
                <DetailRow
                  label="Created"
                  value={`${formatDate(product.createdAt)} by ${product.createdByName
                    }`}
                />
                {product.lastModifiedAt && (
                  <DetailRow
                    label="Last Modified"
                    value={`${formatDate(product.lastModifiedAt)} by ${product.lastModifiedByName
                      }`}
                  />
                )}
              </dl>
            </DetailSection>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isLoading={deleteLoading}
        variant="danger"
      />
    </div>
  );
}
