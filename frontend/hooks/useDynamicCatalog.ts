'use client';

import { useState } from 'react';
import { Product, SearchRequest, SearchResponse, AvailableFilter } from '@/types/catalog';
import { api } from '@/lib/api-client';

export function useDynamicCatalog() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadProducts = async (file: File, searchableFields?: string[]) => {
        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            if (searchableFields && searchableFields.length > 0) {
                searchableFields.forEach(f => formData.append('searchableFields', f));
            }

            // Use api.upload which handles token and base URL
            const result = await api.upload<any>('/catalog/upload', formData);
            return result;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const previewHeaders = async (file: File): Promise<{ key: string; originalKey: string }[]> => {
        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            const result = await api.upload<{ key: string; originalKey: string }[]>('/catalog/preview-headers', formData);
            return result;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const searchProducts = async (request: SearchRequest): Promise<SearchResponse> => {
        setLoading(true);
        setError(null);

        try {
            // Ensure sort parameters are set to avoid backend errors
            const safeRequest = {
                ...request,
                sortBy: request.sortBy || 'createdAt',
                sortDirection: request.sortDirection || 'DESC' // Default to newest first
            };

            // Use api.post which handles content-type, token and base URL
            const result = await api.post<SearchResponse>('/catalog/search', safeRequest);
            return result;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getAvailableFilters = async (): Promise<AvailableFilter[]> => {
        setLoading(true);
        setError(null);

        try {
            // Use api.get which handles token and base URL
            const result = await api.get<AvailableFilter[]>('/catalog/filters');
            return result;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getProductById = async (id: string): Promise<Product> => {
        setLoading(true);
        setError(null);

        try {
            const result = await api.get<Product>(`/catalog/${id}`);
            return result;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateProduct = async (id: string, data: { displayName?: string; attributes?: Product['attributes'] }): Promise<Product> => {
        setLoading(true);
        setError(null);

        try {
            const result = await api.put<Product>(`/catalog/${id}`, data);
            return result;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteProduct = async (id: string, hard = false): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            await api.delete<void>(`/catalog/${id}?hard=${hard}`);
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const bulkDeleteProducts = async (ids: string[], hard = false): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            await api.post<void>('/catalog/bulk-delete', { ids, hard });
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        uploadProducts,
        previewHeaders,
        searchProducts,
        getAvailableFilters,
        getProductById,
        updateProduct,
        deleteProduct,
        bulkDeleteProducts,
        loading,
        error,
    };
}
