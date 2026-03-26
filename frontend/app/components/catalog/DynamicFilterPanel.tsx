"use client";

import React, { useState, useEffect } from 'react';
import { FilterRequest, FilterType } from '@/types/catalog';
import { Filter, X } from 'lucide-react';
import axios from 'axios';

interface DynamicFilterPanelProps {
  onFiltersChange: (filters: Record<string, FilterRequest>) => void;
}

interface AvailableFilter {
  key: string;
  displayName: string;
  type: 'TEXT' | 'NUMBER' | 'SELECT';
  values?: string[];
}

export default function DynamicFilterPanel({ onFiltersChange }: DynamicFilterPanelProps) {
  const [availableFilters, setAvailableFilters] = useState<AvailableFilter[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, FilterRequest>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableFilters();
  }, []);

  const fetchAvailableFilters = async () => {
    try {
      const response = await axios.get('/api/v1/catalog/filters');
      if (response.data.success) {
        setAvailableFilters(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch filters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, filter: FilterRequest | null) => {
    const newFilters = { ...activeFilters };
    if (filter === null) {
      delete newFilters[key];
    } else {
      newFilters[key] = filter;
    }
    setActiveFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    onFiltersChange({});
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
        </div>
        <p className="text-sm text-slate-500">Loading filters...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
        </div>
        {Object.keys(activeFilters).length > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-4">
        {availableFilters.length === 0 ? (
          <p className="text-sm text-slate-500">No filters available</p>
        ) : (
          availableFilters.map((filter) => (
            <FilterControl
              key={filter.key}
              filter={filter}
              value={activeFilters[filter.key]}
              onChange={(value) => handleFilterChange(filter.key, value)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface FilterControlProps {
  filter: AvailableFilter;
  value: FilterRequest | undefined;
  onChange: (value: FilterRequest | null) => void;
}

function FilterControl({ filter, value, onChange }: FilterControlProps) {
  const [inputValue, setInputValue] = useState('');

  const handleTextChange = (text: string) => {
    setInputValue(text);
    if (text.trim()) {
      onChange({
        type: FilterType.CONTAINS,
        value: text.trim()
      });
    } else {
      onChange(null);
    }
  };

  const handleSelectChange = (selected: string) => {
    if (selected) {
      onChange({
        type: FilterType.EXACT,
        value: selected
      });
    } else {
      onChange(null);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-700">
        {filter.displayName}
      </label>

      {filter.type === 'TEXT' && (
        <div className="relative">
          <input
            type="text"
            value={value?.value || inputValue}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={`Filter by ${filter.displayName.toLowerCase()}`}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          {value && (
            <button
              onClick={() => {
                setInputValue('');
                onChange(null);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {filter.type === 'SELECT' && filter.values && (
        <select
          value={value?.value || ''}
          onChange={(e) => handleSelectChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          <option value="">All</option>
          {filter.values.map((val) => (
            <option key={val} value={val}>
              {val}
            </option>
          ))}
        </select>
      )}

      {filter.type === 'NUMBER' && (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={value?.min || ''}
            onChange={(e) => {
              const min = e.target.value ? parseFloat(e.target.value) : undefined;
              onChange({
                type: FilterType.RANGE,
                min,
                max: value?.max
              });
            }}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <input
            type="number"
            placeholder="Max"
            value={value?.max || ''}
            onChange={(e) => {
              const max = e.target.value ? parseFloat(e.target.value) : undefined;
              onChange({
                type: FilterType.RANGE,
                min: value?.min,
                max
              });
            }}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      )}
    </div>
  );
}
