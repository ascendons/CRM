"use client";

import React, { useMemo } from "react";
import { countries } from "@/data/countries-states";

interface CountryStateSelectorProps {
    countryValue: string;
    stateValue: string;
    onCountryChange: (value: string) => void;
    onStateChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
    labelClassName?: string;
    inputClassName?: string;
    countryLabel?: string;
    stateLabel?: string;
    required?: boolean;
}

export const CountryStateSelector: React.FC<CountryStateSelectorProps> = ({
    countryValue,
    stateValue,
    onCountryChange,
    onStateChange,
    disabled = false,
    className = "",
    labelClassName = "block text-sm font-medium text-gray-700 mb-1",
    inputClassName = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100",
    countryLabel = "Country",
    stateLabel = "State/Province",
    required = false,
}) => {
    const selectedCountry = useMemo(() => {
        return countries.find(
            (c) => c.name === countryValue || c.code === countryValue
        );
    }, [countryValue]);

    const states = selectedCountry ? selectedCountry.states : [];

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        onCountryChange(val);
        // Reset state when country changes
        onStateChange("");
    };

    const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onStateChange(e.target.value);
    };

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
            <div>
                <label className={labelClassName}>
                    {countryLabel} {required && <span className="text-red-500">*</span>}
                </label>
                <select
                    value={countryValue}
                    onChange={handleCountryChange}
                    disabled={disabled}
                    className={inputClassName}
                    required={required}
                >
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                        <option key={country.code} value={country.name}>
                            {country.name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className={labelClassName}>
                    {stateLabel} {required && <span className="text-red-500">*</span>}
                </label>
                {states.length > 0 ? (
                    <select
                        value={stateValue}
                        onChange={handleStateChange}
                        disabled={disabled || !countryValue}
                        className={inputClassName}
                        required={required}
                    >
                        <option value="">Select State</option>
                        {states.map((state) => (
                            <option key={state.code} value={state.name}>
                                {state.name}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input
                        type="text"
                        value={stateValue}
                        onChange={(e) => onStateChange(e.target.value)}
                        disabled={disabled || !countryValue}
                        placeholder={countryValue ? "Enter state" : "Select country first"}
                        className={inputClassName}
                        required={required}
                    />
                )}
            </div>
        </div>
    );
};
