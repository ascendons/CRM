import { useState, useEffect, useRef } from 'react';
import { useDynamicCatalog } from '@/hooks/useDynamicCatalog';
import { Product, SearchRequest } from '@/types/catalog';
import { Search, Loader2, X } from 'lucide-react';

interface CatalogProductSearchProps {
    onSelect: (product: Product) => void;
    onCustomSelect?: (name: string) => void;
    allowCustom?: boolean;
    label?: string;
    required?: boolean;
    placeholder?: string;
    disabled?: boolean;
    initialValue?: string;
}

export default function CatalogProductSearch({
    onSelect,
    onCustomSelect,
    allowCustom = false,
    label = "Search Product",
    required = false,
    placeholder = "Type to search products...",
    disabled = false,
    initialValue = ""
}: CatalogProductSearchProps) {
    const [query, setQuery] = useState(initialValue);
    const [results, setResults] = useState<Product[]>([]);
    const [showResults, setShowResults] = useState(false);
    const { searchProducts, loading } = useDynamicCatalog();
    const searchRef = useRef<HTMLDivElement>(null);

    // Sync initial value if provided
    useEffect(() => {
        if (initialValue) {
            setQuery(initialValue);
        }
    }, [initialValue]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


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

    const getProductName = (product: Product) => {
        const nameAttr = product.attributes.find(a =>
            a.key.toLowerCase() === 'productname' ||
            a.key.toLowerCase() === 'product_name' ||
            a.key.toLowerCase() === 'name'
        );
        return nameAttr?.value || product.displayName;
    };

    const handleSelect = (product: Product) => {
        onSelect(product);
        setQuery(getProductName(product)); // Show selected name
        setResults([]);
        setShowResults(false);
    };

    const handleCustomSelect = () => {
        if (allowCustom && onCustomSelect && query.trim()) {
            onCustomSelect(query.trim());
            setResults([]);
            setShowResults(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // If we have search results, select the first one (most relevant)
            if (results.length > 0) {
                handleSelect(results[0]);
            }
            // Otherwise, search first if query has content
            else if (query.trim().length >= 1) {
                handleSearch(query);
            }
            // If custom is allowed, use it as custom
            else if (allowCustom && query.trim()) {
                handleCustomSelect();
            }
        }
    };

    // Helper to get price for display
    const getPrice = (product: Product) => {
        const priceAttr = product.attributes.find(a =>
            a.key.toLowerCase() === 'unitprice' ||
            a.key.toLowerCase() === 'unit_price' ||
            a.key.toLowerCase() === 'base_price' ||
            a.key.toLowerCase() === 'list_price' ||
            a.key.toLowerCase() === 'price'
        );
        return priceAttr?.numericValue ?? priceAttr?.value ?? 'N/A';
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
                        // Optional: trigger custom select on every change? No, wait for selection or blur.
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (!disabled && (results.length > 0 || (allowCustom && query))) setShowResults(true);
                    }}
                    onBlur={() => {
                        // Optional: select custom on blur if nothing selected?
                        // Better to keep explicit selection to avoid accidental inputs.
                    }}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                    disabled={disabled}
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <button
                            type="button"
                            onClick={() => { if (query.trim().length >= 1) handleSearch(query); }}
                            className="hover:text-gray-600 transition-colors"
                            title="Search"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    )}
                </div>
                {query && (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery('');
                            setResults([]);
                            setShowResults(false);
                            if (allowCustom && onCustomSelect) onCustomSelect(""); // Clear selection
                        }}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {showResults && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {/* Custom Option at Top or Bottom? Top is often better for "Create new" feel */}
                    {allowCustom && query.trim() && (
                        <button
                            type="button"
                            onClick={handleCustomSelect}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 transition-colors flex items-center text-blue-700 font-medium"
                        >
                            <span className="mr-2">+</span> Use "{query}" as custom product
                        </button>
                    )}

                    {results.map((product) => (
                        <button
                            key={product.id}
                            type="button"
                            onClick={() => handleSelect(product)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0 border-gray-100 transition-colors flex justify-between items-center group"
                        >
                            <div>
                                <div className="font-medium text-gray-900 group-hover:text-blue-600">
                                    {getProductName(product)}
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

                    {results.length === 0 && !loading && !allowCustom && (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            No products found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
