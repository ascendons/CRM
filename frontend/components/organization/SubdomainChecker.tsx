"use client";

import { useState, useEffect } from "react";
import { organizationApi } from "@/lib/api/organization";
import { validateSubdomain } from "@/lib/utils/subdomain";
import { Globe, Check, X, Loader2 } from "lucide-react";

interface SubdomainCheckerProps {
    value: string;
    onChange: (value: string) => void;
    onValidityChange?: (isValid: boolean) => void;
    className?: string;
}

export default function SubdomainChecker({
    value,
    onChange,
    onValidityChange,
    className = "",
}: SubdomainCheckerProps) {
    const [status, setStatus] = useState<{
        checking: boolean;
        available: boolean | null;
        message: string;
    }>({
        checking: false,
        available: null,
        message: "",
    });

    useEffect(() => {
        const checkSubdomain = async () => {
            const subdomain = value.trim().toLowerCase();

            if (!subdomain) {
                setStatus({ checking: false, available: null, message: "" });
                onValidityChange?.(false);
                return;
            }

            // Client-side validation
            const validation = validateSubdomain(subdomain);
            if (!validation.valid) {
                setStatus({
                    checking: false,
                    available: false,
                    message: validation.error || "Invalid subdomain",
                });
                onValidityChange?.(false);
                return;
            }

            // Server-side check
            setStatus({ checking: true, available: null, message: "Checking..." });

            try {
                const result = await organizationApi.checkSubdomain(subdomain);
                setStatus({
                    checking: false,
                    available: result.available,
                    message: result.message,
                });
                onValidityChange?.(result.available);
            } catch {
                setStatus({
                    checking: false,
                    available: false,
                    message: "Failed to check availability",
                });
                onValidityChange?.(false);
            }
        };

        const timer = setTimeout(checkSubdomain, 500);
        return () => clearTimeout(timer);
    }, [value, onValidityChange]);

    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Subdomain *
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value.toLowerCase())}
                    className="block w-full pl-10 pr-32 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 lowercase text-gray-900"
                    placeholder="acme"
                    required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-sm text-gray-500">.yourcrm.com</span>
                </div>
            </div>

            {/* Status indicator */}
            {value && (
                <div className="mt-2 flex items-center gap-2">
                    {status.checking && (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            <span className="text-sm text-gray-500">Checking availability...</span>
                        </>
                    )}
                    {!status.checking && status.available === true && (
                        <>
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">{status.message}</span>
                        </>
                    )}
                    {!status.checking && status.available === false && (
                        <>
                            <X className="h-4 w-4 text-red-600" />
                            <span className="text-sm text-red-600">{status.message}</span>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
