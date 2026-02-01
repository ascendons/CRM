import { api } from "./api-client";
import type { ProductResponse, CreateProductRequest, UpdateProductRequest } from "@/types/product";

export const productsService = {
  async createProduct(data: CreateProductRequest): Promise<ProductResponse> {
    return api.post("/products", data);
  },

  async getAllProducts(activeOnly = false): Promise<ProductResponse[]> {
    const url = activeOnly ? "/products?activeOnly=true" : "/products";
    return api.get(url);
  },

  async getProductById(id: string): Promise<ProductResponse> {
    return api.get(`/products/${id}`);
  },

  async getProductByProductId(productId: string): Promise<ProductResponse> {
    return api.get(`/products/code/${productId}`);
  },

  async getProductsByCategory(category: string): Promise<ProductResponse[]> {
    return api.get(`/products/category/${encodeURIComponent(category)}`);
  },

  async searchProducts(query: string): Promise<ProductResponse[]> {
    return api.get(`/products/search?q=${encodeURIComponent(query)}`);
  },

  async updateProduct(id: string, data: UpdateProductRequest): Promise<ProductResponse> {
    return api.put(`/products/${id}`, data);
  },

  async deleteProduct(id: string): Promise<void> {
    return api.delete(`/products/${id}`);
  },
};
