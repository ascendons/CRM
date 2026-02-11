# Phase 2: Organization Registration (Critical)

## Overview

**Duration**: 3 days
**Tasks**: 5 (TASK-010 to TASK-014)
**Priority**: 🔴 Critical
**Dependencies**: Phase 1 complete

This phase enables new organizations to register and onboard to the CRM system. It includes subdomain-based multi-tenancy, organization validation, and seamless registration flow.

---

## What You'll Build

1. ✅ Subdomain extraction and validation utilities
2. ✅ Organization API client methods
3. ✅ Full registration page with real-time validation
4. ✅ Updated register redirect to org registration
5. ✅ Reusable subdomain checker component

---

## Success Criteria

By the end of Phase 2, you will have:
- [x] Organizations can self-register with unique subdomains
- [x] Real-time subdomain availability checking
- [x] Admin user created automatically with organization
- [x] Seamless login after registration
- [x] Beautiful, user-friendly registration UI

---

## Task List

- [TASK-010](#task-010-create-subdomain-utilities) - Subdomain Utilities (45 min)
- [TASK-011](#task-011-create-organization-api) - Organization API (1 hour)
- [TASK-012](#task-012-create-organization-registration-page) - Registration Page (3 hours)
- [TASK-013](#task-013-update-register-redirect) - Update Register Redirect (15 min)
- [TASK-014](#task-014-add-subdomain-check-component) - Subdomain Checker Component (45 min)

**Total Time**: ~6 hours actual coding + testing

---

## TASK-010: Create Subdomain Utilities

**Priority**: 🔴 Critical
**Estimated Time**: 45 minutes
**Dependencies**: None
**Files**: `lib/utils/subdomain.ts` (NEW)

### Description
Create utilities for extracting and validating subdomains from URLs.

### Requirements
1. Extract subdomain from hostname
2. Validate subdomain format
3. Handle localhost development
4. Build subdomain URLs

### Implementation

**File**: `lib/utils/subdomain.ts` (NEW FILE)

```typescript
/**
 * Extract subdomain from hostname
 * Examples:
 *   acme.yourcrm.com -> acme
 *   localhost -> null (development)
 *   yourcrm.com -> null (main domain)
 */
export function extractSubdomain(hostname: string): string | null {
  // Development: localhost or 127.0.0.1
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost:')) {
    // Check for subdomain in development (e.g., acme.localhost:3000)
    if (hostname.includes('.localhost')) {
      const parts = hostname.split('.');
      return parts[0];
    }
    return null; // No subdomain in local dev
  }

  // Production: subdomain.yourcrm.com
  const parts = hostname.split('.');

  // Need at least subdomain.domain.tld (3 parts)
  if (parts.length < 3) {
    return null;
  }

  const subdomain = parts[0];

  // Ignore 'www' subdomain
  if (subdomain === 'www') {
    return null;
  }

  return subdomain;
}

/**
 * Build URL with subdomain
 */
export function buildSubdomainUrl(subdomain: string, path: string = ''): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'yourcrm.com';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

  // Handle localhost
  if (baseUrl.includes('localhost')) {
    return `${protocol}://${subdomain}.${baseUrl}${path}`;
  }

  return `${protocol}://${subdomain}.${baseUrl}${path}`;
}

/**
 * Validate subdomain format
 * Rules:
 * - 3-20 characters
 * - Lowercase alphanumeric + hyphens
 * - Cannot start or end with hyphen
 * - Cannot be reserved words
 */
export function validateSubdomain(subdomain: string): {
  valid: boolean;
  error?: string;
} {
  // Reserved subdomains
  const reserved = [
    'www', 'api', 'admin', 'app', 'mail', 'ftp', 'localhost',
    'staging', 'dev', 'test', 'demo', 'dashboard', 'blog',
    'help', 'support', 'docs', 'status', 'about', 'contact'
  ];

  if (reserved.includes(subdomain.toLowerCase())) {
    return {
      valid: false,
      error: `"${subdomain}" is a reserved subdomain`
    };
  }

  // Length check
  if (subdomain.length < 3 || subdomain.length > 20) {
    return {
      valid: false,
      error: 'Subdomain must be 3-20 characters long'
    };
  }

  // Format check
  const regex = /^[a-z0-9]([a-z0-9-]{1,18}[a-z0-9])?$/;
  if (!regex.test(subdomain)) {
    return {
      valid: false,
      error: 'Subdomain must contain only lowercase letters, numbers, and hyphens. Cannot start or end with hyphen.'
    };
  }

  return { valid: true };
}

/**
 * Get current subdomain from window location
 */
export function getCurrentSubdomain(): string | null {
  if (typeof window === 'undefined') return null;
  return extractSubdomain(window.location.hostname);
}
```

### Acceptance Criteria
- [x] Extracts subdomain correctly
- [x] Handles localhost development
- [x] Validates subdomain format
- [x] Rejects reserved words
- [x] Builds subdomain URLs

### Testing
```typescript
// Test cases
import { extractSubdomain, validateSubdomain } from '@/lib/utils/subdomain';

console.log(extractSubdomain('acme.yourcrm.com')); // "acme"
console.log(extractSubdomain('localhost')); // null
console.log(extractSubdomain('www.yourcrm.com')); // null

console.log(validateSubdomain('acme')); // { valid: true }
console.log(validateSubdomain('ab')); // { valid: false, error: "..." }
console.log(validateSubdomain('www')); // { valid: false, error: "..." }
```

---

## TASK-011: Create Organization API

**Priority**: 🔴 Critical
**Estimated Time**: 1 hour
**Dependencies**: TASK-002 (from Phase 1)
**Files**: `lib/api/organization.ts` (NEW)

### Description
Create API client methods for organization-related endpoints.

### Requirements
1. Organization registration
2. Subdomain availability check
3. Get current organization
4. Get usage stats
5. Update settings

### Implementation

**File**: `lib/api/organization.ts` (NEW FILE)

```typescript
import { api } from '../api-client';
import type {
  Organization,
  OrganizationRegistrationRequest,
  OrganizationRegistrationResponse,
  SubdomainAvailability,
  OrganizationUsage,
  OrganizationSettings,
} from '@/types/organization';

export const organizationApi = {
  /**
   * Register new organization
   * Public endpoint - no auth required
   */
  async register(
    data: OrganizationRegistrationRequest
  ): Promise<OrganizationRegistrationResponse> {
    return api.post<OrganizationRegistrationResponse>(
      '/organizations/register',
      data
    );
  },

  /**
   * Check subdomain availability
   * Public endpoint - no auth required
   */
  async checkSubdomain(subdomain: string): Promise<SubdomainAvailability> {
    return api.get<SubdomainAvailability>(
      `/organizations/check-subdomain/${subdomain}`
    );
  },

  /**
   * Get current organization details
   * Requires authentication
   */
  async getCurrent(): Promise<Organization> {
    return api.get<Organization>('/organizations/current');
  },

  /**
   * Get organization usage and limits
   * Requires authentication
   */
  async getUsage(): Promise<OrganizationUsage> {
    return api.get<OrganizationUsage>('/organizations/usage');
  },

  /**
   * Get subscription details
   * Requires authentication
   */
  async getSubscription(): Promise<any> {
    return api.get('/organizations/subscription');
  },

  /**
   * Update organization settings (Admin only)
   * Requires authentication + admin role
   */
  async updateSettings(
    settings: Partial<OrganizationSettings>
  ): Promise<Organization> {
    return api.put<Organization>('/organizations/settings', settings);
  },

  /**
   * Update organization profile (Admin only)
   * Requires authentication + admin role
   */
  async updateProfile(data: {
    organizationName?: string;
    displayName?: string;
    industry?: string;
    companySize?: string;
    primaryEmail?: string;
    primaryPhone?: string;
  }): Promise<Organization> {
    return api.put<Organization>('/organizations/profile', data);
  },
};
```

### Acceptance Criteria
- [x] All API methods defined
- [x] Type-safe with proper interfaces
- [x] Uses centralized API client
- [x] Error handling included
- [x] JSDoc comments added

### Testing
```typescript
// Test in React component
import { organizationApi } from '@/lib/api/organization';

// Test subdomain check
const result = await organizationApi.checkSubdomain('acme');
console.log(result); // { subdomain: 'acme', available: true, message: '...' }

// Test get current (requires auth)
const org = await organizationApi.getCurrent();
console.log(org); // { organizationId: '...', ... }
```

---

## TASK-012: Create Organization Registration Page

**Priority**: 🔴 Critical
**Estimated Time**: 3 hours
**Dependencies**: TASK-010, TASK-011
**Files**: `app/(auth)/register-organization/page.tsx` (NEW)

### Description
Create organization registration page with subdomain validation.

### Requirements
1. Multi-step form (organization + admin user)
2. Real-time subdomain availability check
3. Form validation
4. Beautiful UI matching login page
5. Success handling with redirect

### Implementation

**File**: `app/(auth)/register-organization/page.tsx` (NEW FILE)

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

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
      } catch (err) {
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
    setError("");

    // Validate subdomain is available
    if (!subdomainStatus.available) {
      setError("Please choose an available subdomain");
      return;
    }

    setIsLoading(true);

    try {
      const response = await organizationApi.register({
        organizationName: formData.organizationName,
        subdomain: formData.subdomain.toLowerCase(),
        industry: formData.industry || undefined,
        companySize: formData.companySize || undefined,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
        adminFullName: formData.adminFullName,
      });

      // Set auth from registration response
      authService.setAuth({
        userId: response.userId,
        email: formData.adminEmail,
        fullName: formData.adminFullName,
        role: "ADMIN",
        token: response.token,
        tenantId: response.tenantId,
        organizationId: response.organizationId,
      });

      // Redirect to dashboard
      // In production, redirect to subdomain
      if (process.env.NODE_ENV === 'production') {
        const subdomainUrl = buildSubdomainUrl(formData.subdomain, '/dashboard');
        window.location.href = subdomainUrl;
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
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
                  <AlertCircle className="h-5 w-5 text-red-600" />
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
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="block w-full pl-10 pr-32 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 lowercase"
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
                    className="block w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select industry</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Finance">Finance</option>
                    <option value="Retail">Retail</option>
                    <option value="Manufacturing">Manufacturing</option>
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
                    className="block w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
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
            <div className="space-y-4 pt-4 border-t">
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
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
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
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
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
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !subdomainStatus.available}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
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
```

### Acceptance Criteria
- [x] Multi-step form with organization + admin sections
- [x] Real-time subdomain validation
- [x] Server-side availability check
- [x] Beautiful UI matching design system
- [x] Loading states
- [x] Error handling
- [x] Success redirect

### Testing
```bash
1. Navigate to /register-organization
2. Fill organization name: "Test Corp"
3. Enter subdomain: "testcorp"
4. Watch for availability check
5. Fill admin details
6. Submit form
7. Should redirect to dashboard with auth set
```

---

## TASK-013: Update Register Redirect

**Priority**: 🔴 Critical
**Estimated Time**: 15 minutes
**Dependencies**: TASK-012
**Files**: `app/register/page.tsx` (UPDATE)

### Description
Update the existing register page to redirect to organization registration.

### Requirements
1. Add notice that registration is per-organization
2. Redirect to /register-organization
3. Provide link to login if already registered

### Implementation

**File**: `app/register/page.tsx` (UPDATE)

Add this redirect at the top of the component:

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to organization registration after 3 seconds
    const timer = setTimeout(() => {
      router.push("/register-organization");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg mb-4">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Register Your Organization
          </h2>
          <p className="mt-4 text-base text-gray-600">
            To use this CRM, you need to create an organization first.
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Redirecting you to organization registration...
            </p>

            <Link
              href="/register-organization"
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-semibold shadow-lg"
            >
              Continue to Registration
              <ArrowRight className="h-5 w-5" />
            </Link>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Acceptance Criteria
- [x] Page explains organization-based registration
- [x] Auto-redirects after 3 seconds
- [x] Manual "Continue" button
- [x] Link to login page
- [x] Beautiful UI matching design

### Testing
```bash
1. Navigate to /register
2. See notice about organization registration
3. Wait 3 seconds or click button
4. Should redirect to /register-organization
```

---

## TASK-014: Add Subdomain Check Component

**Priority**: 🟡 Important
**Estimated Time**: 45 minutes
**Dependencies**: TASK-010, TASK-011
**Files**: `components/organization/SubdomainChecker.tsx` (NEW)

### Description
Create reusable component for subdomain availability checking.

### Requirements
1. Real-time validation
2. Visual feedback (loading, success, error)
3. Reusable across forms
4. TypeScript types

### Implementation

**File**: `components/organization/SubdomainChecker.tsx` (NEW FILE)

```typescript
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
      } catch (err) {
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
          className="block w-full pl-10 pr-32 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 lowercase"
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
```

### Acceptance Criteria
- [x] Reusable component
- [x] Real-time validation
- [x] Visual feedback
- [x] TypeScript types
- [x] Callback for validity change

### Testing
```typescript
// Use in any form
import SubdomainChecker from '@/components/organization/SubdomainChecker';

function MyForm() {
  const [subdomain, setSubdomain] = useState("");
  const [isValid, setIsValid] = useState(false);

  return (
    <SubdomainChecker
      value={subdomain}
      onChange={setSubdomain}
      onValidityChange={setIsValid}
    />
  );
}
```

---

## Phase 2 Complete!

You now have a complete organization registration flow. Organizations can:
- Self-register with unique subdomains
- See real-time subdomain availability
- Create admin accounts automatically
- Login seamlessly after registration

**Next Step**: Move to [Phase 3: Organization Management](./PHASE_3_ORGANIZATION_MANAGEMENT.md)
