"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { productsService } from "@/lib/products";
import type { ProductResponse, UpdateProductRequest, ProductStatus } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface EditProductPageProps {
  params: {
    id: string;
  };
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const router = useRouter();
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateProductRequest>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await productsService.getProductById(params.id);
      setProduct(data);
      setFormData({
        productName: data.productName,
        description: data.description,
        basePrice: data.basePrice,
        unit: data.unit,
        taxRate: data.taxRate,
        taxType: data.taxType,
        category: data.category,
        subcategory: data.subcategory,
        tags: data.tags,
        status: data.status,
        stockQuantity: data.stockQuantity,
        minStockLevel: data.minStockLevel,
        maxStockLevel: data.maxStockLevel,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch product");
      router.push("/admin/products");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.productName && formData.productName.length < 2) {
      newErrors.productName = "Product name must be at least 2 characters";
    }

    if (formData.basePrice !== undefined && formData.basePrice <= 0) {
      newErrors.basePrice = "Base price must be greater than 0";
    }

    if (formData.taxRate !== undefined && (formData.taxRate < 0 || formData.taxRate > 100)) {
      newErrors.taxRate = "Tax rate must be between 0 and 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      setSaving(true);
      await productsService.updateProduct(params.id, formData);
      toast.success("Product updated successfully");
      router.push(`/admin/products/${params.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof UpdateProductRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
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
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/products/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground">Update product information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>SKU cannot be changed once created</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={product.sku} disabled className="bg-muted" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  value={formData.productName}
                  onChange={(e) => handleChange("productName", e.target.value)}
                  className={errors.productName ? "border-red-500" : ""}
                />
                {errors.productName && <p className="text-sm text-red-500">{errors.productName}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Tax</CardTitle>
            <CardDescription>Update pricing and tax information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basePrice">Base Price</Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.basePrice || ""}
                  onChange={(e) => handleChange("basePrice", parseFloat(e.target.value))}
                  className={errors.basePrice ? "border-red-500" : ""}
                />
                {errors.basePrice && <p className="text-sm text-red-500">{errors.basePrice}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select value={formData.unit} onValueChange={(value) => handleChange("unit", value)}>
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="piece">Piece</SelectItem>
                    <SelectItem value="kg">Kilogram</SelectItem>
                    <SelectItem value="meter">Meter</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="liter">Liter</SelectItem>
                    <SelectItem value="hour">Hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.taxRate || ""}
                  onChange={(e) => handleChange("taxRate", parseFloat(e.target.value))}
                  className={errors.taxRate ? "border-red-500" : ""}
                />
                {errors.taxRate && <p className="text-sm text-red-500">{errors.taxRate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxType">Tax Type</Label>
                <Select value={formData.taxType} onValueChange={(value) => handleChange("taxType", value)}>
                  <SelectTrigger id="taxType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GST">GST</SelectItem>
                    <SelectItem value="VAT">VAT</SelectItem>
                    <SelectItem value="NONE">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categorization */}
        <Card>
          <CardHeader>
            <CardTitle>Categorization</CardTitle>
            <CardDescription>Update product categorization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategory</Label>
                <Input
                  id="subcategory"
                  value={formData.subcategory || ""}
                  onChange={(e) => handleChange("subcategory", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>Update product status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="status">Product Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange("status", value as ProductStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                  <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Management</CardTitle>
            <CardDescription>Update stock levels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Current Stock</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  min="0"
                  value={formData.stockQuantity !== undefined ? formData.stockQuantity : ""}
                  onChange={(e) =>
                    handleChange("stockQuantity", e.target.value ? parseInt(e.target.value) : undefined)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minStockLevel">Minimum Stock Level</Label>
                <Input
                  id="minStockLevel"
                  type="number"
                  min="0"
                  value={formData.minStockLevel !== undefined ? formData.minStockLevel : ""}
                  onChange={(e) =>
                    handleChange("minStockLevel", e.target.value ? parseInt(e.target.value) : undefined)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxStockLevel">Maximum Stock Level</Label>
                <Input
                  id="maxStockLevel"
                  type="number"
                  min="0"
                  value={formData.maxStockLevel !== undefined ? formData.maxStockLevel : ""}
                  onChange={(e) =>
                    handleChange("maxStockLevel", e.target.value ? parseInt(e.target.value) : undefined)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/admin/products/${params.id}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
