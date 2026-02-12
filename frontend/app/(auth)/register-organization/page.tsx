"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { organizationApi } from "@/lib/api/organization";
import { authService } from "@/lib/auth";
import { validateSubdomain, buildSubdomainUrl } from "@/lib/utils/subdomain";
import { ApiError } from "@/lib/api-client";
import {
    Building2,
    Mail,
    Lock,
    User,
    Globe,
    Check,
    X,
    Loader2,
    ArrowRight,
    AlertCircle,
} from "lucide-react";

export default function RegisterOrganizationPage() {
    const [formData, setFormData] = useState({
        organizationName: "",
        subdomain: "",
        industry: "",
        companySize: "",
        adminEmail: "",
        adminPassword: "",
        adminFullName: "",
    });

    const [error, setError] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Subdomain validation state
    const [subdomainStatus, setSubdomainStatus] = useState<{
        checking: boolean;
        available: boolean | null;
        message: string;
    }>({
        checking: false,
        available: null,
        message: "",
    });

    // Debounced subdomain check
    useEffect(() => {
        const checkSubdomain = async () => {
            const subdomain = formData.subdomain.trim().toLowerCase();

            if (!subdomain) {
                setSubdomainStatus({ checking: false, available: null, message: "" });
                return;
            }

            // Client-side validation first
            const validation = validateSubdomain(subdomain);
            if (!validation.valid) {
                setSubdomainStatus({
                    checking: false,
                    available: false,
                    message: validation.error || "Invalid subdomain",
                });
                return;
            }

            // Server-side availability check
            setSubdomainStatus({ checking: true, available: null, message: "Checking..." });

            try {
                const result = await organizationApi.checkSubdomain(subdomain);
                setSubdomainStatus({
                    checking: false,
                    available: result.available,
                    message: result.message,
                });
            } catch {
                setSubdomainStatus({
                    checking: false,
                    available: false,
                    message: "Failed to check availability",
                });
            }
        };

        const timer = setTimeout(checkSubdomain, 500);
        return () => clearTimeout(timer);
    }, [formData.subdomain]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("[RegisterOrganizationPage] Form submitted", {
            organizationName: formData.organizationName,
            subdomain: formData.subdomain,
            adminEmail: formData.adminEmail
        });
        setError("");

        // Validate subdomain is available
        if (!subdomainStatus.available) {
            console.warn("[RegisterOrganizationPage] Subdomain not available", formData.subdomain);
            setError("Please choose an available subdomain");
            return;
        }

        setIsLoading(true);

        try {
            console.log("[RegisterOrganizationPage] Calling organizationApi.register...");
            const response = await organizationApi.register({
                organizationName: formData.organizationName,
                subdomain: formData.subdomain.toLowerCase(),
                industry: formData.industry || undefined,
                companySize: formData.companySize || undefined,
                adminEmail: formData.adminEmail,
                password: formData.adminPassword,
                adminName: formData.adminFullName,
            });

            console.log("[RegisterOrganizationPage] Registration response success", {
                tenantId: response.tenantId,
                organizationId: response.organizationId
            });

            // Set auth from registration response
            authService.setAuth({
                userId: response.userId,
                email: response.userEmail || formData.adminEmail,
                fullName: formData.adminFullName,
                role: "ADMIN",
                token: response.token,
                tenantId: response.tenantId,
                organizationId: response.organizationId,
                organizationName: response.organizationName,
            });

            // Redirect to dashboard
            if (process.env.NODE_ENV === 'production') {
                const subdomainUrl = buildSubdomainUrl(formData.subdomain, '/dashboard');
                console.log("[RegisterOrganizationPage] Redirecting to production subdomain URL", subdomainUrl);
                window.location.href = subdomainUrl;
            } else {
                console.log("[RegisterOrganizationPage] Redirecting to local dashboard");
                window.location.href = '/dashboard';
            }
        } catch (err) {
            console.error("[RegisterOrganizationOrganizationPage] Registration failed", err);
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError("Registration failed. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg mb-4">
                        <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                        Create Your Organization
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Already have an account?{" "}
                        <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500">
                            Sign in here
                        </Link>
                    </p>
                </div>

                <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                                    <p className="text-sm font-medium text-red-800">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Organization Details */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Organization Details</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Organization Name *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Building2 className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="organizationName"
                                        required
                                        value={formData.organizationName}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                        placeholder="Acme Corporation"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Subdomain *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Globe className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="subdomain"
                                        required
                                        value={formData.subdomain}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-32 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 lowercase text-gray-900"
                                        placeholder="acme"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        <span className="text-sm text-gray-500">.yourcrm.com</span>
                                    </div>
                                </div>

                                {/* Subdomain status */}
                                {formData.subdomain && (
                                    <div className="mt-2 flex items-center gap-2">
                                        {subdomainStatus.checking && (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                                <span className="text-sm text-gray-500">Checking availability...</span>
                                            </>
                                        )}
                                        {!subdomainStatus.checking && subdomainStatus.available === true && (
                                            <>
                                                <Check className="h-4 w-4 text-green-600" />
                                                <span className="text-sm text-green-600">{subdomainStatus.message}</span>
                                            </>
                                        )}
                                        {!subdomainStatus.checking && subdomainStatus.available === false && (
                                            <>
                                                <X className="h-4 w-4 text-red-600" />
                                                <span className="text-sm text-red-600">{subdomainStatus.message}</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Industry
                                    </label>
                                    <select
                                        name="industry"
                                        value={formData.industry}
                                        onChange={handleChange}
                                        className="block w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    >
                                        <option value="">Select industry</option>
                                        <option value="Technology">Technology</option>
                                        <option value="Healthcare">Healthcare</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Retail">Retail</option>
                                        <option value="Manufacturing">Manufacturing</option>
                                        <option value="Education">Education</option>
                                        <option value="Real Estate">Real Estate</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Company Size
                                    </label>
                                    <select
                                        name="companySize"
                                        value={formData.companySize}
                                        onChange={handleChange}
                                        className="block w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    >
                                        <option value="">Select size</option>
                                        <option value="1-10">1-10 employees</option>
                                        <option value="11-50">11-50 employees</option>
                                        <option value="51-200">51-200 employees</option>
                                        <option value="201-500">201-500 employees</option>
                                        <option value="500+">500+ employees</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Admin User */}
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">Admin User</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Full Name *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="adminFullName"
                                        required
                                        value={formData.adminFullName}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Email Address *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        name="adminEmail"
                                        required
                                        value={formData.adminEmail}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900"
                                        placeholder="admin@acme.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Password *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="adminPassword"
                                        required
                                        minLength={8}
                                        value={formData.adminPassword}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !subdomainStatus.available}
                            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg transition-colors"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin h-5 w-5" />
                                    Creating Organization...
                                </>
                            ) : (
                                <>
                                    Create Organization
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
