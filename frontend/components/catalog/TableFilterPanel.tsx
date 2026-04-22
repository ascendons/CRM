"use client";

import React, { useState, useEffect } from "react";
import { Filter, X, ChevronDown, ChevronRight } from "lucide-react";

export interface TableFilters {
  productName?: string;
  category?: string;
  inventoryStatus?: string;
  attributes?: Record<string, string>; // key: attribute key, value: filter value
}

interface TableFilterPanelProps {
  products: any[];
  inventoryStatuses: Record<string, any>;
  onFiltersChange: (filters: TableFilters) => void;
}

interface AttributeFilterOption {
  key: string;
  displayName: string;
  values: string[];
}

export default function TableFilterPanel({
  products,
  inventoryStatuses,
  onFiltersChange,
}: TableFilterPanelProps) {
  const [activeFilters, setActiveFilters] = useState<TableFilters>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [attributeFilters, setAttributeFilters] = useState<AttributeFilterOption[]>([]);
  const [showAttributes, setShowAttributes] = useState(true);

  // Extract unique categories and attributes from products
  useEffect(() => {
    // Categories
    const uniqueCategories = Array.from(
      new Set(products.map((p) => p.category).filter(Boolean))
    ).sort();
    setCategories(uniqueCategories);

    // Attributes
    const attributeMap = new Map<string, Set<string>>();

    products.forEach((product) => {
      if (product.attributes && Array.isArray(product.attributes)) {
        product.attributes.forEach((attr: any) => {
          if (attr.key && attr.value) {
            if (!attributeMap.has(attr.key)) {
              attributeMap.set(attr.key, new Set());
            }
            attributeMap.get(attr.key)?.add(attr.value);
          }
        });
      }
    });

    // Convert to array and sort
    const attributes: AttributeFilterOption[] = Array.from(attributeMap.entries())
      .map(([key, values]) => ({
        key,
        displayName: key,
        values: Array.from(values).sort(),
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

    setAttributeFilters(attributes);
  }, [products]);

  const handleFilterChange = (key: Exclude<keyof TableFilters, "attributes">, value: string) => {
    const newFilters = { ...activeFilters };
    if (value === "") {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    setActiveFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleAttributeFilterChange = (attributeKey: string, value: string) => {
    const newFilters = { ...activeFilters };
    if (!newFilters.attributes) {
      newFilters.attributes = {};
    }

    if (value === "") {
      delete newFilters.attributes[attributeKey];
      if (Object.keys(newFilters.attributes).length === 0) {
        delete newFilters.attributes;
      }
    } else {
      newFilters.attributes[attributeKey] = value;
    }

    setActiveFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    onFiltersChange({});
  };

  const hasActiveFilters =
    Object.keys(activeFilters).length > 0 ||
    (activeFilters.attributes && Object.keys(activeFilters.attributes).length > 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-5">
        {/* Product Name Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-700 uppercase tracking-wide">
            Product Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={activeFilters.productName || ""}
              onChange={(e) => handleFilterChange("productName", e.target.value)}
              placeholder="Filter by name..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {activeFilters.productName && (
              <button
                onClick={() => handleFilterChange("productName", "")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-700 uppercase tracking-wide">
            Category
          </label>
          <select
            value={activeFilters.category || ""}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Inventory Status Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-700 uppercase tracking-wide">
            Inventory Status
          </label>
          <select
            value={activeFilters.inventoryStatus || ""}
            onChange={(e) => handleFilterChange("inventoryStatus", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
          >
            <option value="">All Products</option>
            <option value="tracked">Tracked</option>
            <option value="not-tracked">Not Tracked</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>

        {/* Attribute Filters */}
        {attributeFilters.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => setShowAttributes(!showAttributes)}
              className="flex items-center justify-between w-full mb-3 text-xs font-medium text-slate-700 uppercase tracking-wide hover:text-slate-900"
            >
              <span>Attributes ({attributeFilters.length})</span>
              {showAttributes ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {showAttributes && (
              <div className="space-y-4">
                {attributeFilters.map((attr) => (
                  <div key={attr.key} className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">{attr.displayName}</label>
                    <select
                      value={activeFilters.attributes?.[attr.key] || ""}
                      onChange={(e) => handleAttributeFilterChange(attr.key, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                    >
                      <option value="">All</option>
                      {attr.values.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-slate-100">
            <div className="text-xs font-medium text-slate-700 mb-2">Active Filters:</div>
            <div className="flex flex-wrap gap-2">
              {activeFilters.productName && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                  Name: {activeFilters.productName}
                  <button
                    onClick={() => handleFilterChange("productName", "")}
                    className="hover:bg-purple-100 rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {activeFilters.category && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                  Category: {activeFilters.category}
                  <button
                    onClick={() => handleFilterChange("category", "")}
                    className="hover:bg-blue-100 rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {activeFilters.inventoryStatus && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                  Status: {activeFilters.inventoryStatus.replace("-", " ")}
                  <button
                    onClick={() => handleFilterChange("inventoryStatus", "")}
                    className="hover:bg-green-100 rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {activeFilters.attributes &&
                Object.entries(activeFilters.attributes).map(([key, value]) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs"
                  >
                    {key}: {value}
                    <button
                      onClick={() => handleAttributeFilterChange(key, "")}
                      className="hover:bg-amber-100 rounded p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
