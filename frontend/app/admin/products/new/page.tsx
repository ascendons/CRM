"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import Link from "next/link";
import { productsService } from "@/lib/products";
import type { CreateProductRequest } from "@/types/product";
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

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateProductRequest>({
    sku: "",
    productName: "",
    description: "",
    basePrice: 0,
    currency: "INR",
    unit: "piece",
    taxRate: 18,
    taxType: "GST",
    category: "",
    subcategory: "",
    tags: [],
    stockQuantity: undefined,
    minStockLevel: undefined,
    maxStockLevel: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.sku.trim()) {
      newErrors.sku = "SKU is required";
    } else if (!/^[A-Z0-9-]+$/.test(formData.sku)) {
      newErrors.sku = "SKU must contain only uppercase letters, numbers, and hyphens";
    }

    if (!formData.productName.trim()) {
      newErrors.productName = "Product name is required";
    } else if (formData.productName.length < 2) {
      newErrors.productName = "Product name must be at least 2 characters";
    }

    if (!formData.basePrice || formData.basePrice <= 0) {
      newErrors.basePrice = "Base price must be greater than 0";
    }

    if (!formData.unit.trim()) {
      newErrors.unit = "Unit is required";
    }

    if (formData.taxRate < 0 || formData.taxRate > 100) {
      newErrors.taxRate = "Tax rate must be between 0 and 100";
    }

    if (!formData.category.trim()) {
      newErrors.category = "Category is required";
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
      setLoading(true);
      await productsService.createProduct(formData);
      toast.success("Product created successfully");
      router.push("/admin/products");
    } catch (error: any) {
      toast.error(error.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateProductRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Product</h1>
          <p className="text-muted-foreground">Add a new product to your catalog</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential product details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">
                  SKU <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="sku"
                  placeholder="PIPE-001"
                  value={formData.sku}
                  onChange={(e) => handleChange("sku", e.target.value.toUpperCase())}
                  className={errors.sku ? "border-red-500" : ""}
                />
                {errors.sku && <p className="text-sm text-red-500">{errors.sku}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="productName">
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="productName"
                  placeholder="Steel Pipe"
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
                placeholder="Heavy duty steel pipe for construction"
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Tax</CardTitle>
            <CardDescription>Set product pricing and tax information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basePrice">
                  Base Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="10.00"
                  value={formData.basePrice || ""}
                  onChange={(e) => handleChange("basePrice", parseFloat(e.target.value))}
                  className={errors.basePrice ? "border-red-500" : ""}
                />
                {errors.basePrice && <p className="text-sm text-red-500">{errors.basePrice}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => handleChange("currency", value)}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">
                  Unit <span className="text-red-500">*</span>
                </Label>
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
                <Label htmlFor="taxRate">
                  Tax Rate (%) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="18.00"
                  value={formData.taxRate || ""}
                  onChange={(e) => handleChange("taxRate", parseFloat(e.target.value))}
                  className={errors.taxRate ? "border-red-500" : ""}
                />
                {errors.taxRate && <p className="text-sm text-red-500">{errors.taxRate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxType">
                  Tax Type <span className="text-red-500">*</span>
                </Label>
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
            <CardDescription>Organize your product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="category"
                  placeholder="Hardware"
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className={errors.category ? "border-red-500" : ""}
                />
                {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategory</Label>
                <Input
                  id="subcategory"
                  placeholder="Pipes"
                  value={formData.subcategory}
                  onChange={(e) => handleChange("subcategory", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory (Optional) */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Management</CardTitle>
            <CardDescription>Track stock levels (optional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Current Stock</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  min="0"
                  placeholder="100"
                  value={formData.stockQuantity || ""}
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
                  placeholder="10"
                  value={formData.minStockLevel || ""}
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
                  placeholder="1000"
                  value={formData.maxStockLevel || ""}
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
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Product"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/products">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
