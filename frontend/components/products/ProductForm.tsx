"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProductResponse, CreateProductRequest, UpdateProductRequest } from "@/types/product";
import { showToast } from "@/lib/toast";

interface ProductFormProps {
    initialData?: ProductResponse;
    onSubmit: (data: any) => Promise<void>;
    isEditing?: boolean;
}

export default function ProductForm({ initialData, onSubmit, isEditing = false }: ProductFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form state
    const [productName, setProductName] = useState(initialData?.productName || "");
    const [sku, setSku] = useState(initialData?.sku || "");
    const [category, setCategory] = useState(initialData?.category || "");
    const [subcategory, setSubcategory] = useState(initialData?.subcategory || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [basePrice, setBasePrice] = useState<number>(initialData?.basePrice || 0);
    const [taxRate, setTaxRate] = useState<number>(initialData?.taxRate || 18);
    const [taxType, setTaxType] = useState(initialData?.taxType || "GST");
    const [listPrice, setListPrice] = useState<number | undefined>(initialData?.listPrice);
    const [discount, setDiscount] = useState<number | undefined>(initialData?.discount);
    const [unit, setUnit] = useState(initialData?.unit || "pcs");
    const [stockQuantity, setStockQuantity] = useState<number>(initialData?.stockQuantity || 0);
    const [minStockLevel, setMinStockLevel] = useState<number | undefined>(initialData?.minStockLevel);
    const [maxStockLevel, setMaxStockLevel] = useState<number | undefined>(initialData?.maxStockLevel);
    const [reorderLevel, setReorderLevel] = useState<number | undefined>(initialData?.reorderLevel);
    // Default to true for new products, use existing value for edits
    const [isActive, setIsActive] = useState(initialData ? initialData.isActive : true);
    // Map isActive to status enum for UpdateRequest if needed, or handle separately
    const [status, setStatus] = useState(initialData?.status || "ACTIVE");

    useEffect(() => {
        if (initialData) {
            setProductName(initialData.productName);
            setSku(initialData.sku);
            setCategory(initialData.category || "");
            setSubcategory(initialData.subcategory || "");
            setDescription(initialData.description || "");
            setBasePrice(initialData.basePrice);
            setTaxRate(initialData.taxRate || 0);
            setTaxType(initialData.taxType || "GST");
            setListPrice(initialData.listPrice);
            setDiscount(initialData.discount);
            setUnit(initialData.unit || "pcs");
            setStockQuantity(initialData.stockQuantity || 0);
            setMinStockLevel(initialData.minStockLevel);
            setMaxStockLevel(initialData.maxStockLevel);
            setReorderLevel(initialData.reorderLevel);
            setIsActive(initialData.isActive);
            setStatus(initialData.status || "ACTIVE");
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!productName.trim()) {
            showToast.error("Please enter a product name");
            return;
        }
        // SKU is typically read-only in edit mode or strictly validated
        if (!isEditing && !sku.trim()) {
            showToast.error("Please enter a SKU");
            return;
        }
        if (basePrice <= 0) {
            showToast.error("Base price must be greater than 0");
            return;
        }

        try {
            setLoading(true);

            const formData = {
                productName: productName.trim(),
                sku: sku.trim(),
                category: category.trim() || undefined,
                subcategory: subcategory.trim() || undefined,
                description: description.trim() || undefined,
                basePrice,
                taxRate,
                taxType,
                listPrice,
                discount,
                unit,
                stockQuantity,
                minStockLevel,
                maxStockLevel,
                reorderLevel,
                isActive,
                status: isActive ? "ACTIVE" : "DISCONTINUED" // Simple mapping for now
            };

            await onSubmit(formData);

        } catch (err) {
            // Error handling is usually done in the parent or here depending on preference.
            // We'll re-throw or handle if passed handler doesn't catch.
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">
                    Basic Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            placeholder="e.g., Laptop Dell XPS 15"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            SKU <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                            placeholder="e.g., LAPTOP-DELL-XPS15"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                            required
                            disabled={isEditing}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category
                        </label>
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="e.g., Electronics"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subcategory
                        </label>
                        <input
                            type="text"
                            value={subcategory}
                            onChange={(e) => setSubcategory(e.target.value)}
                            placeholder="e.g., Laptops"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Unit
                        </label>
                        <select
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="pcs">Pieces</option>
                            <option value="kg">Kilograms</option>
                            <option value="ltr">Liters</option>
                            <option value="box">Boxes</option>
                            <option value="unit">Units</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brief description of the product..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4 border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900">Pricing</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Base Price (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={basePrice}
                            onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                            step="0.01"
                            min="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tax Rate (%)
                        </label>
                        <input
                            type="number"
                            value={taxRate}
                            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                            step="0.01"
                            min="0"
                            max="100"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tax Type
                        </label>
                        <select
                            value={taxType}
                            onChange={(e) => setTaxType(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="GST">GST</option>
                            <option value="VAT">VAT</option>
                            <option value="NONE">None</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            List Price (₹)
                        </label>
                        <input
                            type="number"
                            value={listPrice || ""}
                            onChange={(e) =>
                                setListPrice(
                                    e.target.value ? parseFloat(e.target.value) : undefined
                                )
                            }
                            step="0.01"
                            min="0"
                            placeholder="Optional"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Discount (%)
                        </label>
                        <input
                            type="number"
                            value={discount || ""}
                            onChange={(e) =>
                                setDiscount(
                                    e.target.value ? parseFloat(e.target.value) : undefined
                                )
                            }
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="Optional"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Inventory */}
            <div className="space-y-4 border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900">Inventory</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Stock Quantity
                        </label>
                        <input
                            type="number"
                            value={stockQuantity}
                            onChange={(e) =>
                                setStockQuantity(parseInt(e.target.value) || 0)
                            }
                            min="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reorder Level
                        </label>
                        <input
                            type="number"
                            value={reorderLevel || ""}
                            onChange={(e) =>
                                setReorderLevel(
                                    e.target.value ? parseInt(e.target.value) : undefined
                                )
                            }
                            min="0"
                            placeholder="Optional"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Min Stock Level
                        </label>
                        <input
                            type="number"
                            value={minStockLevel || ""}
                            onChange={(e) =>
                                setMinStockLevel(
                                    e.target.value ? parseInt(e.target.value) : undefined
                                )
                            }
                            min="0"
                            placeholder="Optional"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Stock Level
                        </label>
                        <input
                            type="number"
                            value={maxStockLevel || ""}
                            onChange={(e) =>
                                setMaxStockLevel(
                                    e.target.value ? parseInt(e.target.value) : undefined
                                )
                            }
                            min="0"
                            placeholder="Optional"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Status */}
            <div className="border-t pt-6">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="isActive"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                        htmlFor="isActive"
                        className="ml-2 block text-sm text-gray-900"
                    >
                        Active (Product is available for sale)
                    </label>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                    type="button"
                    onClick={() => router.back()}
                    disabled={loading}
                    className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
                </button>
            </div>
        </form>
    );
}
