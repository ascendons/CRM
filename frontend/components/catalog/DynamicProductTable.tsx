'use client';

import { Product } from '@/types/catalog';
import { Package, Eye, Pencil, Trash2 } from 'lucide-react';

interface Props {
    products: Product[];
    selectedIds?: Set<string>;
    onSelectionChange?: (ids: Set<string>) => void;
    onView?: (product: Product) => void;
    onEdit?: (product: Product) => void;
    onDelete?: (product: Product) => void;
}

export default function DynamicProductTable({ products, selectedIds = new Set(), onSelectionChange, onView, onEdit, onDelete }: Props) {
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
    const attributeKeys = Array.from(allKeys).sort();

    const getDisplayName = (key: string): string => {
        const attr = products
            .flatMap(p => p.attributes)
            .find(a => a.key === key);
        return attr?.displayKey || key;
    };

    const allSelected = products.length > 0 && products.every(p => selectedIds.has(p.id));
    const someSelected = products.some(p => selectedIds.has(p.id));

    const toggleAll = () => {
        if (!onSelectionChange) return;
        if (allSelected) {
            onSelectionChange(new Set());
        } else {
            onSelectionChange(new Set(products.map(p => p.id)));
        }
    };

    const toggleOne = (id: string) => {
        if (!onSelectionChange) return;
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        onSelectionChange(next);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            {onSelectionChange && (
                                <th scope="col" className="pl-4 pr-2 py-4 w-10">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                                        onChange={toggleAll}
                                        className="w-4 h-4 accent-primary rounded cursor-pointer"
                                    />
                                </th>
                            )}
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
                            <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {products.map((product) => {
                            const isSelected = selectedIds.has(product.id);
                            return (
                                <tr
                                    key={product.id}
                                    className={`hover:bg-slate-50 transition-colors group ${isSelected ? 'bg-primary/5' : ''}`}
                                >
                                    {onSelectionChange && (
                                        <td className="pl-4 pr-2 py-4 w-10">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleOne(product.id)}
                                                className="w-4 h-4 accent-primary rounded cursor-pointer"
                                            />
                                        </td>
                                    )}
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
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {onView && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onView(product); }}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                    title="View details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            )}
                                            {onEdit && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onEdit(product); }}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                                    title="Edit product"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDelete(product); }}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    title="Delete product"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
