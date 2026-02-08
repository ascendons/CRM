import { api } from "./api-client";
import type { ProductResponse, CreateProductRequest, UpdateProductRequest } from "@/types/product";
import type { Page, PaginationParams } from "@/types/common";

export const productsService = {
  async createProduct(data: CreateProductRequest): Promise<ProductResponse> {
    return api.post("/products", data);
  },

  async getAllProducts(
    activeOnly = false,
    pagination?: PaginationParams
  ): Promise<Page<ProductResponse> | ProductResponse[]> {
    const params = new URLSearchParams();
    if (activeOnly) params.append("activeOnly", "true");

    // If no pagination provided, fetch 'all' (large size)
    if (pagination) {
      if (pagination.page !== undefined) params.append("page", String(pagination.page - 1));
      if (pagination.size !== undefined) params.append("size", String(pagination.size));
      if (pagination.sort) params.append("sort", pagination.sort);
    } else {
      params.append("size", "1000"); // Fetch large batch for dropdowns
    }

    const response = await api.get<any>(`/products?${params.toString()}`);

    // Handle paginated response structure from backend
    if (response && response.content && Array.isArray(response.content)) {
      return pagination ? response : response.content;
    }

    // Fallback if it is already an array (though backend usually returns Page)
    return Array.isArray(response) ? response : [];
  },

  async getProductById(id: string): Promise<ProductResponse> {
    return api.get(`/products/${id}`);
  },

  async getProductByProductId(productId: string): Promise<ProductResponse> {
    return api.get(`/products/code/${productId}`);
  },

  async getProductsByCategory(
    category: string,
    pagination?: PaginationParams
  ): Promise<Page<ProductResponse> | ProductResponse[]> {
    const params = new URLSearchParams();
    if (pagination) {
      if (pagination.page !== undefined) params.append("page", String(pagination.page - 1));
      if (pagination.size !== undefined) params.append("size", String(pagination.size));
      if (pagination.sort) params.append("sort", pagination.sort);
    }
    return api.get(`/products/category/${encodeURIComponent(category)}?${params.toString()}`);
  },

  async searchProducts(
    query: string,
    pagination?: PaginationParams
  ): Promise<Page<ProductResponse> | ProductResponse[]> {
    const params = new URLSearchParams();
    params.append("q", query);
    if (pagination) {
      if (pagination.page !== undefined) params.append("page", String(pagination.page - 1));
      if (pagination.size !== undefined) params.append("size", String(pagination.size));
      if (pagination.sort) params.append("sort", pagination.sort);
    }
    return api.get(`/products/search?${params.toString()}`);
  },

  async updateProduct(id: string, data: UpdateProductRequest): Promise<ProductResponse> {
    return api.put(`/products/${id}`, data);
  },

  async deleteProduct(id: string): Promise<void> {
    return api.delete(`/products/${id}`);
  },

  async downloadTemplate(): Promise<Blob> {
    return api.download("/products/template");
  },

  async importProducts(file: File): Promise<ProductResponse[]> {
    const formData = new FormData();
    formData.append("file", file);
    return api.upload<ProductResponse[]>("/products/import", formData);
  },
};
