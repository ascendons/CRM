"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Page error:", error);

        if (process.env.NODE_ENV === "production") {
            // TODO: Send to error tracking service
        }
    }, [error]);

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
                        Something went wrong!
                    </h2>

                    <p className="text-gray-600 text-center mb-6">
                        We encountered an error while loading this page.
                    </p>

                    {process.env.NODE_ENV === "development" && (
                        <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                            <p className="text-xs font-mono text-red-800 break-all">
                                {error.message}
                            </p>
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            onClick={reset}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors"
                        >
                            <RefreshCw className="h-5 w-5" />
                            Try Again
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
