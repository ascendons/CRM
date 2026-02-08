'use client';

import { useState, useEffect } from 'react';
import { AvailableFilter, FilterRequest, FilterType, AttributeType } from '@/types/catalog';
import { useDynamicCatalog } from '@/hooks/useDynamicCatalog';

interface Props {
    onFiltersChange: (filters: Record<string, FilterRequest>) => void;
}

export default function DynamicFilterPanel({ onFiltersChange }: Props) {
    const [availableFilters, setAvailableFilters] = useState<AvailableFilter[]>([]);
    const [selectedFilters, setSelectedFilters] = useState<Record<string, FilterRequest>>({});
    const { getAvailableFilters, loading } = useDynamicCatalog();

    useEffect(() => {
        loadFilters();
    }, []);

    const loadFilters = async () => {
        try {
            const filters = await getAvailableFilters();
            setAvailableFilters(filters);
        } catch (error) {
            console.error('Failed to load filters:', error);
        }
    };

    const handleFilterChange = (attributeKey: string, filterRequest: FilterRequest | null) => {
        const updated = { ...selectedFilters };

        if (filterRequest === null) {
            delete updated[attributeKey];
        } else {
            updated[attributeKey] = filterRequest;
        }

        setSelectedFilters(updated);
        onFiltersChange(updated);
    };

    const renderFilter = (filter: AvailableFilter) => {
        switch (filter.type) {
            case AttributeType.STRING:
                return (
                    <MultiSelectFilter
                        key={filter.attributeKey}
                        filter={filter}
                        onChange={(values) =>
                            handleFilterChange(filter.attributeKey,
                                values.length > 0 ? { type: FilterType.IN, values } : null
                            )
                        }
                    />
                );

            case AttributeType.NUMBER:
                return (
                    <RangeFilter
                        key={filter.attributeKey}
                        filter={filter}
                        onChange={(min, max) =>
                            handleFilterChange(filter.attributeKey,
                                min !== null || max !== null ? { type: FilterType.RANGE, min: min || undefined, max: max || undefined } : null
                            )
                        }
                    />
                );

            default:
                return null;
        }
    };

    if (loading) {
        return <div className="p-4 text-sm text-gray-500">Loading filters...</div>;
    }

    return (
        <div className="w-64 bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-6 h-fit sticky top-24">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Filters</h3>
                {Object.keys(selectedFilters).length > 0 && (
                    <button
                        onClick={() => {
                            setSelectedFilters({});
                            onFiltersChange({});
                        }}
                        className="text-xs text-primary font-medium hover:text-primary-hover hover:underline"
                    >
                        Clear All
                    </button>
                )}
            </div>

            <div className="space-y-6">
                {availableFilters.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No filters available.</p>
                ) : (
                    availableFilters.map(renderFilter)
                )}
            </div>
        </div>
    );
}

function MultiSelectFilter({
    filter,
    onChange
}: {
    filter: AvailableFilter;
    onChange: (values: string[]) => void;
}) {
    const [selected, setSelected] = useState<string[]>([]);

    const toggleValue = (value: string) => {
        const updated = selected.includes(value)
            ? selected.filter(v => v !== value)
            : [...selected, value];

        setSelected(updated);
        onChange(updated);
    };

    return (
        <div className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
            <h4 className="font-medium text-sm text-slate-700 mb-3">{filter.displayName}</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {filter.availableValues.map((value) => (
                    <label key={value} className="flex items-start gap-2.5 text-sm cursor-pointer group">
                        <div className="relative flex items-center mt-0.5">
                            <input
                                type="checkbox"
                                checked={selected.includes(value)}
                                onChange={() => toggleValue(value)}
                                className="peer h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer transition-all"
                            />
                        </div>
                        <span className="text-slate-600 group-hover:text-slate-900 transition-colors leading-tight">{value}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}

function RangeFilter({
    filter,
    onChange
}: {
    filter: AvailableFilter;
    onChange: (min: number | null, max: number | null) => void;
}) {
    const [min, setMin] = useState<string>('');
    const [max, setMax] = useState<string>('');

    const handleChange = (newMin: string, newMax: string) => {
        setMin(newMin);
        setMax(newMax);
        onChange(
            newMin ? parseFloat(newMin) : null,
            newMax ? parseFloat(newMax) : null
        );
    };

    return (
        <div className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
            <h4 className="font-medium text-sm text-slate-700 mb-3">{filter.displayName}</h4>
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <input
                        type="number"
                        placeholder="Min"
                        value={min}
                        onChange={(e) => handleChange(e.target.value, max)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                    />
                </div>
                <span className="text-slate-400">-</span>
                <div className="relative flex-1">
                    <input
                        type="number"
                        placeholder="Max"
                        value={max}
                        onChange={(e) => handleChange(min, e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                    />
                </div>
            </div>
        </div>
    );
}
