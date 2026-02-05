"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface Option {
    label: string;
    value: string;
}

interface MultiSelectDropdownProps {
    label: string;
    options: Option[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
}

export function MultiSelectDropdown({
    label,
    options,
    selectedValues,
    onChange,
}: MultiSelectDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (value: string) => {
        if (selectedValues.includes(value)) {
            onChange(selectedValues.filter((v) => v !== value));
        } else {
            onChange([...selectedValues, value]);
        }
    };

    const handleSelectAll = () => {
        if (selectedValues.length === options.length) {
            onChange([]);
        } else {
            onChange(options.map((o) => o.value));
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between gap-2 px-4 py-2.5 bg-white border rounded-xl text-sm font-medium transition-all min-w-[200px] ${isOpen ? "border-primary ring-2 ring-primary/10" : "border-slate-200 hover:border-slate-300"
                    }`}
            >
                <span className={selectedValues.length > 0 ? "text-slate-900" : "text-slate-500"}>
                    {selectedValues.length > 0
                        ? `${label}: ${selectedValues.length} selected`
                        : label}
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-full min-w-[240px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-fade-in p-1">
                    <div className="p-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Statuses</span>
                        <button
                            onClick={handleSelectAll}
                            className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                        >
                            {selectedValues.length === options.length ? "Clear All" : "Select All"}
                        </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
                        {options.map((option) => {
                            const isSelected = selectedValues.includes(option.value);
                            return (
                                <div
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-primary/5 text-primary" : "hover:bg-slate-50 text-slate-700"
                                        }`}
                                >
                                    <div className={`flex items-center justify-center h-4 w-4 rounded border ${isSelected ? "bg-primary border-primary" : "border-slate-300 bg-white"
                                        }`}>
                                        {isSelected && <Check className="h-3 w-3 text-white" />}
                                    </div>
                                    <span className="text-sm font-medium">{option.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
