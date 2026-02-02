"use client";

import { useRouter } from "next/navigation";
import { productsService } from "@/lib/products";
import { showToast } from "@/lib/toast";
import ProductForm from "@/components/products/ProductForm";
import { CreateProductRequest } from "@/types/product";

export default function NewProductPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    // Transform form data to match API request if needed
    // The form data largely matches CreateProductRequest, but ensuring types
    const requestData: CreateProductRequest = {
      productName: data.productName,
      sku: data.sku,
      category: data.category,
      subcategory: data.subcategory,
      description: data.description,
      basePrice: data.basePrice,
      currency: "INR", // Default or from settings
      unit: data.unit,
      taxRate: data.taxRate,
      taxType: data.taxType,
      listPrice: data.listPrice,
      discount: data.discount,
      tags: [], // Add tags support if needed later
      stockQuantity: data.stockQuantity,
      minStockLevel: data.minStockLevel,
      maxStockLevel: data.maxStockLevel,
      reorderLevel: data.reorderLevel,
      // isActive is not in CreateProductRequest based on backend DTO view? 
      // Let's check DTO. The DTO view showed earlier didn't have isActive/status in CreateProductRequest.
      // Wait, CreateProductRequest showed in step 778:
      // private String sku;
      // private String productName;
      // private String description;
      // private BigDecimal basePrice;
      // private String currency;
      // private String unit;
      // private BigDecimal taxRate;
      // private String taxType;
      // private String category;
      // private String subcategory;
      // private List<String> tags;
      // private Integer stockQuantity;
      // private Integer minStockLevel;
      // private Integer maxStockLevel;
      // No isActive or status field in CreateProductRequest.
    };

    const created = await productsService.createProduct(requestData);
    showToast.success("Product created successfully");
    router.push(`/products/${created.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Create New Product</h1>
            <p className="text-gray-600 mt-1">Add a new product to your catalog</p>
          </div>

          <ProductForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
