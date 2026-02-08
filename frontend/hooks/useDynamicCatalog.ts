'use client';

import { useState } from 'react';
import { Product, SearchRequest, SearchResponse, AvailableFilter } from '@/types/catalog';
import { api } from '@/lib/api-client';

export function useDynamicCatalog() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadProducts = async (file: File) => {
        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

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

    return {
        uploadProducts,
        searchProducts,
        getAvailableFilters,
        loading,
        error,
    };
}
