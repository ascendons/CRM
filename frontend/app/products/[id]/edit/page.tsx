"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { productsService } from "@/lib/products";
import { showToast } from "@/lib/toast";
import ProductForm from "@/components/products/ProductForm";
import { ProductResponse, UpdateProductRequest } from "@/types/product";
import { authService } from "@/lib/auth";

export default function EditProductPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const [product, setProduct] = useState<ProductResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authService.isAuthenticated()) {
            router.push("/login");
            return;
        }
        loadProduct();
    }, [id, router]);

    const loadProduct = async () => {
        try {
            setLoading(true);
            const data = await productsService.getProductById(id);
            setProduct(data);
        } catch (err) {
            showToast.error("Failed to load product");
            router.push("/products");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: any) => {
        try {
            // Transform form data to match API request
            const requestData: UpdateProductRequest = {
                productName: data.productName,
                description: data.description,
                basePrice: data.basePrice,
                unit: data.unit,
                taxRate: data.taxRate,
                taxType: data.taxType,
                category: data.category,
                subcategory: data.subcategory,
                tags: data.tags || [],
                status: data.status,
                stockQuantity: data.stockQuantity,
                minStockLevel: data.minStockLevel,
                maxStockLevel: data.maxStockLevel,
                // reorderLevel is typically an inventory management field, explicitly check DTO if it exists
                // UpdateProductRequest view in step 752 showed:
                // stockQuantity, minStockLevel, maxStockLevel. 
                // No reorderLevel found in backend UpdateProductRequest.
                // So we might omit reorderLevel if backend doesn't support it in UpdateDTO, or if minStockLevel acts as reorderLevel.
                // Based on CreateProductRequest vs UpdateProductRequest, it seems somewhat inconsistent or reorderLevel might be mapped to minStockLevel?
                // Let's assume minStockLevel is what we want for alerts.
            };

            await productsService.updateProduct(id, requestData);
            showToast.success("Product updated successfully");
            router.push(`/products/${id}`);
        } catch (err) {
            showToast.error(
                err instanceof Error ? err.message : "Failed to update product"
            );
            throw err; // Re-throw to let form handle loading state if needed, though form handles it via prop async
        }
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

    if (!product) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
                        <p className="text-gray-600 mt-1">Update product information</p>
                    </div>

                    <ProductForm
                        initialData={product}
                        onSubmit={handleSubmit}
                        isEditing={true}
                    />
                </div>
            </div>
        </div>
    );
}
