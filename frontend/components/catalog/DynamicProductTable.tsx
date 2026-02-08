'use client';

import { Product } from '@/types/catalog';
import { Package, ChevronRight } from 'lucide-react';

interface Props {
    products: Product[];
    onProductClick?: (product: Product) => void;
}

export default function DynamicProductTable({ products, onProductClick }: Props) {
    if (products.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <Package className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">No products found</h3>
                <p className="text-slate-500">Try adjusting your search or filters to find what you're looking for.</p>
            </div>
        );
    }

    // Extract all unique attribute keys from all products to build columns
    const allKeys = new Set<string>();
    products.forEach(product => {
        product.attributes.forEach(attr => allKeys.add(attr.key));
    });

    // Sort keys alphabetically or by some priority if available
    const attributeKeys = Array.from(allKeys).sort();

    // Get display name for attribute key
    const getDisplayName = (key: string): string => {
        const attr = products
            .flatMap(p => p.attributes)
            .find(a => a.key === key);
        return attr?.displayKey || key;
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                Product ID
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                Name
                            </th>
                            {attributeKeys.map((key) => (
                                <th
                                    key={key}
                                    scope="col"
                                    className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                                >
                                    {getDisplayName(key)}
                                </th>
                            ))}
                            <th scope="col" className="relative px-6 py-4">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {products.map((product) => (
                            <tr
                                key={product.id}
                                onClick={() => onProductClick?.(product)}
                                className="hover:bg-slate-50 cursor-pointer transition-colors group"
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono">
                                            {product.productId}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                                    {product.displayName}
                                </td>
                                {attributeKeys.map((key) => {
                                    const attr = product.attributes.find(a => a.key === key);
                                    return (
                                        <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {attr ? (
                                                <span>
                                                    {attr.value}
                                                    {attr.unit && <span className="text-slate-400 ml-1 text-xs">{attr.unit}</span>}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300">—</span>
                                            )}
                                        </td>
                                    );
                                })}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
