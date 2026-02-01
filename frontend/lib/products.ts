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
    if (pagination) {
      if (pagination.page !== undefined) params.append("page", String(pagination.page - 1)); // Backend expects 0-indexed
      if (pagination.size !== undefined) params.append("size", String(pagination.size));
      if (pagination.sort) params.append("sort", pagination.sort);
    }
    return api.get(`/products?${params.toString()}`);
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
};
