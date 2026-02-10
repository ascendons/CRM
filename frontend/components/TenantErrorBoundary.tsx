"use client";

import React, { Component, ReactNode } from "react";
import { Building2, RefreshCw, LogOut } from "lucide-react";
import { authService } from "@/lib/auth";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Specialized error boundary for tenant-related errors
 * Handles multi-tenancy specific issues like:
 * - Invalid tenant ID
 * - Tenant access denied
 * - Tenant not found
 */
export class TenantErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Tenant error:", error, errorInfo);

        const isTenantError =
            error.message.includes("tenant") ||
            error.message.includes("organization") ||
            error.message.includes("403") ||
            error.message.includes("Forbidden");

        if (isTenantError) {
            console.error("Multi-tenancy error detected:", error.message);
        }
    }

    handleLogout = () => {
        authService.logout();
        window.location.href = "/login";
    };

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
        });
    };

    render() {
        if (this.state.hasError) {
            const error = this.state.error;
            const isTenantError =
                error?.message.includes("tenant") ||
                error?.message.includes("organization") ||
                error?.message.includes("403");

            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                    <div className="max-w-md w-full">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                            <div className="flex justify-center mb-4">
                                <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center">
                                    <Building2 className="h-8 w-8 text-orange-600" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                                {isTenantError ? "Organization Access Issue" : "Something went wrong"}
                            </h2>

                            <p className="text-gray-600 text-center mb-6">
                                {isTenantError
                                    ? "There was a problem accessing your organization data. This might be due to permissions or your session has expired."
                                    : "An unexpected error occurred. Please try again or contact support."}
                            </p>

                            {process.env.NODE_ENV === "development" && error && (
                                <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                                    <p className="text-xs font-mono text-orange-800 break-all">
                                        {error.toString()}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-3">
                                <button
                                    onClick={this.handleRetry}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors"
                                >
                                    <RefreshCw className="h-5 w-5" />
                                    Try Again
                                </button>
                                {isTenantError && (
                                    <button
                                        onClick={this.handleLogout}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors"
                                    >
                                        <LogOut className="h-5 w-5" />
                                        Logout & Sign In Again
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
