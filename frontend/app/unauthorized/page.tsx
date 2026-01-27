"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";

/**
 * Page shown when user tries to access a resource without required permissions.
 */
export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-red-100 p-6">
            <ShieldAlert className="h-16 w-16 text-red-600" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Access Denied</h1>

        {/* Message */}
        <p className="text-gray-600 mb-2">
          You don&apos;t have permission to access this resource.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          If you believe this is an error, please contact your administrator to request access.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="inline-flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>

          <Button
            variant="primary"
            onClick={() => router.push("/")}
            className="inline-flex items-center"
          >
            <Home className="h-4 w-4 mr-2" />
            Go to Home
          </Button>
        </div>

        {/* Additional info */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Need help? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
