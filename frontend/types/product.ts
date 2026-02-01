export type ProductStatus = "ACTIVE" | "DISCONTINUED" | "OUT_OF_STOCK" | "DRAFT";

export interface ProductResponse {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  description?: string;
  basePrice: number;
  currency: string;
  unit: string;
  taxRate: number;
  taxType: string;
  category: string;
  subcategory?: string;
  tags: string[];
  stockQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  status: ProductStatus;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  lastModifiedAt: string;
  lastModifiedBy?: string;
  lastModifiedByName?: string;
}

export interface CreateProductRequest {
  sku: string;
  productName: string;
  description?: string;
  basePrice: number;
  currency?: string;
  unit: string;
  taxRate: number;
  taxType: string;
  category: string;
  subcategory?: string;
  tags?: string[];
  stockQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
}

export interface UpdateProductRequest {
  productName?: string;
  description?: string;
  basePrice?: number;
  unit?: string;
  taxRate?: number;
  taxType?: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  status?: ProductStatus;
  stockQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
}
