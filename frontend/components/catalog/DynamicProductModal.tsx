'use client';

import { useState, useEffect } from 'react';
import { Product, ProductAttribute } from '@/types/catalog';
import { X, Save, Package, Clock, User } from 'lucide-react';

interface Props {
    product: Product | null;
    mode: 'view' | 'edit';
    open: boolean;
    saving?: boolean;
    onClose: () => void;
    onSave?: (data: { displayName: string; attributes: ProductAttribute[] }) => void;
}

export default function DynamicProductModal({ product, mode, open, saving, onClose, onSave }: Props) {
    const [displayName, setDisplayName] = useState('');
    const [attributes, setAttributes] = useState<ProductAttribute[]>([]);

    useEffect(() => {
        if (product) {
            setDisplayName(product.displayName || '');
            setAttributes(product.attributes.map(a => ({ ...a })));
        }
    }, [product]);

    if (!open || !product) return null;

    const handleAttributeChange = (index: number, value: string) => {
        setAttributes(prev => {
            const next = [...prev];
            next[index] = { ...next[index], value };
            return next;
        });
    };

    const handleSave = () => {
        onSave?.({ displayName, attributes });
    };

    const isView = mode === 'view';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col mx-4 animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                {isView ? 'Product Details' : 'Edit Product'}
                            </h2>
                            <p className="text-xs text-slate-500 font-mono">{product.productId}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {/* Product Name */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Product Name</label>
                        {isView ? (
                            <p className="text-sm text-slate-900 bg-slate-50 px-3 py-2.5 rounded-lg">{displayName}</p>
                        ) : (
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        )}
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center gap-6 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(product.createdAt).toLocaleDateString()}
                        </span>
                        {product.createdBy && (
                            <span className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" />
                                {product.createdBy}
                            </span>
                        )}
                    </div>

                    {/* Attributes */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Attributes</h3>
                        <div className="space-y-2">
                            {attributes.map((attr, index) => (
                                <div
                                    key={attr.key}
                                    className="flex items-center gap-3 bg-slate-50 px-3 py-2.5 rounded-lg"
                                >
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-36 flex-shrink-0 truncate" title={attr.displayKey || attr.key}>
                                        {attr.displayKey || attr.key}
                                    </span>
                                    {isView ? (
                                        <span className="text-sm text-slate-900 flex-1">
                                            {attr.value}
                                            {attr.unit && <span className="text-slate-400 ml-1 text-xs">{attr.unit}</span>}
                                        </span>
                                    ) : (
                                        <input
                                            type="text"
                                            value={attr.value}
                                            onChange={(e) => handleAttributeChange(index, e.target.value)}
                                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                {!isView && (
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
