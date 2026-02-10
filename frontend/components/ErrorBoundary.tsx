"use client";

import React, { Component, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Error caught by boundary:", error, errorInfo);

        if (process.env.NODE_ENV === "production") {
            // TODO: Send to Sentry, LogRocket, etc.
        }

        this.setState({
            error,
            errorInfo,
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                    <div className="max-w-md w-full">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                            <div className="flex justify-center mb-4">
                                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                                    <AlertCircle className="h-8 w-8 text-red-600" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                                Something went wrong
                            </h2>

                            <p className="text-gray-600 text-center mb-6">
                                We&apos;re sorry, but something unexpected happened. Please try again.
                            </p>

                            {process.env.NODE_ENV === "development" && this.state.error && (
                                <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                                    <p className="text-xs font-mono text-red-800 break-all">
                                        {this.state.error.toString()}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-3">
                                <button
                                    onClick={this.handleReload}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors"
                                >
                                    <RefreshCw className="h-5 w-5" />
                                    Reload Page
                                </button>
                                <button
                                    onClick={() => (window.location.href = "/")}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors"
                                >
                                    <Home className="h-5 w-5" />
                                    Go to Home
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
