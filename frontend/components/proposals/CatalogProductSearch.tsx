import { useState, useEffect, useRef } from 'react';
import { useDynamicCatalog } from '@/hooks/useDynamicCatalog';
import { Product, SearchRequest } from '@/types/catalog';
import { Search, Loader2, X } from 'lucide-react';

interface CatalogProductSearchProps {
    onSelect: (product: Product) => void;
    label?: string;
    required?: boolean;
    placeholder?: string;
    disabled?: boolean;
}

export default function CatalogProductSearch({
    onSelect,
    label = "Search Product",
    required = false,
    placeholder = "Type to search products...",
    disabled = false
}: CatalogProductSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [showResults, setShowResults] = useState(false);
    const { searchProducts, loading } = useDynamicCatalog();
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length >= 1) { // Reduced threshold to 1 char
                handleSearch(query);
            } else {
                setResults([]);
            }
        }, 300); // Reduced debounce to 300ms for snappier feel

        return () => clearTimeout(timer);
    }, [query]);

    const handleSearch = async (searchTerm: string) => {
        try {
            const request: SearchRequest = {
                keyword: searchTerm,
                page: 0,
                size: 10
            };
            const response = await searchProducts(request);
            setResults(response.content);
            setShowResults(true);
        } catch (error) {
            console.error("Search failed", error);
        }
    };

    const handleSelect = (product: Product) => {
        onSelect(product);
        setQuery('');
        setResults([]);
        setShowResults(false);
    };

    // Helper to get price for display
    const getPrice = (product: Product) => {
        const priceAttr = product.attributes.find(a =>
            a.key === 'base_price' ||
            a.key === 'list_price' ||
            a.key === 'price' ||
            a.key.includes('price')
        );
        return priceAttr?.value || 'N/A';
    };

    return (
        <div className="relative" ref={searchRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (e.target.value.length === 0) setShowResults(false);
                    }}
                    onFocus={() => {
                        if (!disabled && results.length > 0) setShowResults(true);
                    }}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                    disabled={disabled}
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Search className="w-5 h-5" />
                    )}
                </div>
                {query && (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery('');
                            setResults([]);
                            setShowResults(false);
                        }}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {showResults && results.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {results.map((product) => (
                        <button
                            key={product.id}
                            type="button"
                            onClick={() => handleSelect(product)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0 border-gray-100 transition-colors flex justify-between items-center group"
                        >
                            <div>
                                <div className="font-medium text-gray-900 group-hover:text-blue-600">
                                    {product.displayName}
                                </div>
                                <div className="text-xs text-gray-500 flex gap-2">
                                    <span>ID: {product.productId}</span>
                                    {product.category && <span>• {product.category}</span>}
                                </div>
                            </div>
                            <div className="text-sm font-medium text-gray-700">
                                {getPrice(product)}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {showResults && query.length >= 1 && results.length === 0 && !loading && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
                    No products found
                </div>
            )}
        </div>
    );
}
