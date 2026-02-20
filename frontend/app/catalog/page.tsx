'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product, SearchRequest, FilterRequest } from '@/types/catalog';
import { useDynamicCatalog } from '@/hooks/useDynamicCatalog';
import DynamicFilterPanel from '@/components/catalog/DynamicFilterPanel';
import DynamicProductTable from '@/components/catalog/DynamicProductTable';
import { Pagination } from '@/components/common/Pagination'; // Using existing Pagination component
import { Search, Upload, Plus, Info } from 'lucide-react';

export default function CatalogPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [keyword, setKeyword] = useState('');
    const [filters, setFilters] = useState<Record<string, FilterRequest>>({});

    const { searchProducts, loading, error: apiError } = useDynamicCatalog();

    useEffect(() => {
        performSearch();
    }, [currentPage, pageSize, filters]);

    const performSearch = async () => {
        try {
            const request: SearchRequest = {
                keyword: keyword || undefined,
                filters: Object.keys(filters).length > 0 ? filters : undefined,
                page: currentPage - 1,
                size: pageSize,
                sortBy: 'createdAt',
                sortDirection: 'DESC'
            };

            const result = await searchProducts(request);
            setProducts(result.content);
            setTotalElements(result.totalElements);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error('Search failed:', error);
        }
    };

    const handleSearch = () => {
        setCurrentPage(1);
        performSearch();
    };

    return (
        <div className="min-h-screen bg-transparent">
            {/* Header */}
            <div className="sticky top-16 z-20 bg-white/80 backdrop-blur-lg border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dynamic Catalog</h1>
                            <p className="text-sm text-slate-500">Explore products with flexible attributes.</p>
                        </div>
                        <button
                            onClick={() => router.push('/catalog/upload')}
                            className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
                        >
                            <Upload className="h-4 w-4" />
                            Upload Products
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in-up">
                {/* Upload Instructions Banner */}
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="text-sm font-semibold mb-1">Excel Upload Requirements</h3>
                        <p className="text-sm text-blue-700">
                            To ensure proper data mapping in proposals, please ensure your uploaded Excel file always contains the following column headers:
                            <code className="mx-1 px-1.5 py-0.5 bg-white rounded border border-blue-100 text-xs font-mono">ProductName</code>,
                            <code className="mx-1 px-1.5 py-0.5 bg-white rounded border border-blue-100 text-xs font-mono">Unit</code>,
                            <code className="mx-1 px-1.5 py-0.5 bg-white rounded border border-blue-100 text-xs font-mono">Description</code>,
                            <code className="mx-1 px-1.5 py-0.5 bg-white rounded border border-blue-100 text-xs font-mono">UnitPrice</code>, and
                            <code className="mx-1 px-1.5 py-0.5 bg-white rounded border border-blue-100 text-xs font-mono">HsnCode</code>.
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search products by keyword..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                        <button
                            onClick={handleSearch}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            Search
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 items-start">
                    {/* Filter Panel */}
                    <div className="w-full lg:w-64 flex-shrink-0">
                        <DynamicFilterPanel onFiltersChange={setFilters} />
                    </div>

                    {/* Results */}
                    <div className="flex-1 w-full min-w-0">
                        {apiError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-4 text-sm">
                                Error: {apiError}
                            </div>
                        )}

                        <div className="mb-4 text-sm text-slate-500 font-medium">
                            Found {totalElements} products
                        </div>

                        <DynamicProductTable products={products} />

                        {totalElements > 0 && (
                            <div className="mt-6">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalElements={totalElements}
                                    pageSize={pageSize}
                                    onPageChange={setCurrentPage}
                                    onPageSizeChange={setPageSize}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
