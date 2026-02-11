# Phase 6: Polish & Testing (Nice to Have)

## Overview

**Duration**: 3 days
**Tasks**: 2 (TASK-029 to TASK-030)
**Priority**: 🟢 Nice to Have
**Dependencies**: All previous phases complete

This phase focuses on production readiness, error handling, and comprehensive testing. It ensures the multi-tenancy implementation is robust, reliable, and user-friendly.

---

## What You'll Build

1. ✅ Error Boundaries for graceful error handling
2. ✅ Integration Tests for critical flows

---

## Success Criteria

By the end of Phase 6, you will have:
- [x] Graceful error handling across the app
- [x] Production-ready error boundaries
- [x] Comprehensive integration tests
- [x] Documented test coverage
- [x] Production deployment checklist

---

## Task List

- [TASK-029](#task-029-add-error-boundaries) - Error Boundaries (1.5 hours)
- [TASK-030](#task-030-add-integration-tests) - Integration Tests (4 hours)

**Total Time**: ~5.5 hours actual coding + testing

---

## TASK-029: Add Error Boundaries

**Priority**: 🟢 Nice to Have
**Estimated Time**: 1.5 hours
**Dependencies**: All previous phases
**Files**:
- `components/ErrorBoundary.tsx` (NEW)
- `components/TenantErrorBoundary.tsx` (NEW)
- `app/error.tsx` (UPDATE or NEW)

### Description
Create error boundaries to catch and handle errors gracefully, especially for multi-tenancy operations.

### Requirements
1. Global error boundary
2. Tenant-specific error boundary
3. Error logging
4. User-friendly error messages
5. Recovery actions

### Implementation

**File**: `components/ErrorBoundary.tsx` (NEW FILE)

```typescript
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

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    console.error("Error caught by boundary:", error, errorInfo);

    // In production, send to error tracking service
    if (process.env.NODE_ENV === "production") {
      // TODO: Send to Sentry, LogRocket, etc.
      // logErrorToService(error, errorInfo);
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
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                Something went wrong
              </h2>

              {/* Message */}
              <p className="text-gray-600 text-center mb-6">
                We're sorry, but something unexpected happened. Please try again.
              </p>

              {/* Error details (only in development) */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs font-mono text-red-800 break-all">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={this.handleReload}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
                >
                  <RefreshCw className="h-5 w-5" />
                  Reload Page
                </button>
                <button
                  onClick={() => (window.location.href = "/")}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium"
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
```

**File**: `components/TenantErrorBoundary.tsx` (NEW FILE)

```typescript
"use client";

import React, { Component, ReactNode } from "react";
import { Building2, AlertCircle, LogOut, RefreshCw } from "lucide-react";
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

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Tenant error:", error, errorInfo);

    // Check if it's a tenant-related error
    const isTenantError =
      error.message.includes("tenant") ||
      error.message.includes("organization") ||
      error.message.includes("403") ||
      error.message.includes("Forbidden");

    if (isTenantError) {
      // Log specific tenant error
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
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-orange-600" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                {isTenantError ? "Organization Access Issue" : "Something went wrong"}
              </h2>

              {/* Message */}
              <p className="text-gray-600 text-center mb-6">
                {isTenantError
                  ? "There was a problem accessing your organization data. This might be due to permissions or your session has expired."
                  : "An unexpected error occurred. Please try again or contact support."}
              </p>

              {/* Error details (development only) */}
              {process.env.NODE_ENV === "development" && error && (
                <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-xs font-mono text-orange-800 break-all">
                    {error.toString()}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
                >
                  <RefreshCw className="h-5 w-5" />
                  Try Again
                </button>
                {isTenantError && (
                  <button
                    onClick={this.handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium"
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
```

**File**: `app/error.tsx` (NEW FILE - Next.js 13+ Error UI)

```typescript
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
    // Log error to console
    console.error("Page error:", error);

    // In production, send to error tracking
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
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
            >
              <RefreshCw className="h-5 w-5" />
              Try Again
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium"
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
```

**File**: `providers/TenantProvider.tsx` (UPDATE)

Wrap the return statement with TenantErrorBoundary:

```typescript
import { TenantErrorBoundary } from '@/components/TenantErrorBoundary'; // ADD

// ... existing code ...

return (
  <TenantErrorBoundary>  {/* ADD */}
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  </TenantErrorBoundary>  {/* ADD */}
);
```

### Acceptance Criteria
- [x] Error boundaries implemented
- [x] Tenant-specific error handling
- [x] User-friendly error messages
- [x] Recovery actions available
- [x] Error logging in development
- [x] Production-ready error tracking hooks

### Testing
```bash
# Test error boundary
1. Throw error in component
2. See error boundary UI
3. Test retry action
4. Test logout action

# Test tenant errors
1. Invalidate token manually
2. Make API call
3. Should show tenant error boundary
4. Test logout flow
```

---

## TASK-030: Add Integration Tests

**Priority**: 🟢 Nice to Have
**Estimated Time**: 4 hours
**Dependencies**: All previous phases
**Files**:
- `__tests__/integration/auth.test.ts` (NEW)
- `__tests__/integration/organization.test.ts` (NEW)
- `__tests__/integration/tenant.test.ts` (NEW)
- `jest.config.js` (NEW or UPDATE)
- `jest.setup.js` (NEW)

### Description
Create comprehensive integration tests for critical multi-tenancy flows.

### Requirements
1. Test organization registration flow
2. Test login with tenant validation
3. Test API calls with tenantId
4. Test invitation flow
5. Mock API responses

### Implementation

**Step 1**: Install Testing Dependencies

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom
```

**Step 2**: Configure Jest

**File**: `jest.config.js` (NEW FILE)

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
}

module.exports = createJestConfig(customJestConfig)
```

**File**: `jest.setup.js` (NEW FILE)

```javascript
import '@testing-library/jest-dom'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;
```

**File**: `__tests__/integration/auth.test.ts` (NEW FILE)

```typescript
import { authService } from '@/lib/auth';
import { extractTenantId, validateToken } from '@/lib/utils/jwt';

describe('Authentication with Multi-Tenancy', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should extract tenantId from JWT token', () => {
    // Mock JWT token with tenantId
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsInJvbGUiOiJVU0VSIiwidGVuYW50SWQiOiJ0ZW5hbnQtMTIzIiwiZXhwIjo5OTk5OTk5OTk5LCJpYXQiOjE2MDAwMDAwMDB9.test';

    const tenantId = extractTenantId(mockToken);

    expect(tenantId).toBe('tenant-123');
  });

  test('should validate token contains tenantId', () => {
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsInJvbGUiOiJVU0VSIiwidGVuYW50SWQiOiJ0ZW5hbnQtMTIzIiwiZXhwIjo5OTk5OTk5OTk5LCJpYXQiOjE2MDAwMDAwMDB9.test';

    const isValid = validateToken(validToken);

    expect(isValid).toBe(true);
  });

  test('should reject token without tenantId', () => {
    const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsInJvbGUiOiJVU0VSIiwiZXhwIjo5OTk5OTk5OTk5LCJpYXQiOjE2MDAwMDAwMDB9.test';

    const isValid = validateToken(invalidToken);

    expect(isValid).toBe(false);
  });

  test('should store tenantId in user object after login', () => {
    const authResponse = {
      userId: 'user-123',
      email: 'test@test.com',
      fullName: 'Test User',
      role: 'USER' as const,
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsInJvbGUiOiJVU0VSIiwidGVuYW50SWQiOiJ0ZW5hbnQtMTIzIiwiZXhwIjo5OTk5OTk5OTk5LCJpYXQiOjE2MDAwMDAwMDB9.test',
      tenantId: 'tenant-123',
      organizationId: 'org-123',
      organizationName: 'Test Org',
    };

    authService.setAuth(authResponse);

    const user = authService.getUser();

    expect(user).toBeDefined();
    expect(user?.tenantId).toBe('tenant-123');
    expect(user?.organizationId).toBe('org-123');
  });
});
```

**File**: `__tests__/integration/organization.test.ts` (NEW FILE)

```typescript
import { validateSubdomain } from '@/lib/utils/subdomain';
import { extractSubdomain } from '@/lib/utils/subdomain';

describe('Organization Subdomain Validation', () => {
  test('should validate correct subdomain format', () => {
    const result = validateSubdomain('acme');

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('should reject subdomain too short', () => {
    const result = validateSubdomain('ab');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('3-20 characters');
  });

  test('should reject subdomain too long', () => {
    const result = validateSubdomain('a'.repeat(21));

    expect(result.valid).toBe(false);
    expect(result.error).toContain('3-20 characters');
  });

  test('should reject reserved subdomains', () => {
    const reserved = ['www', 'api', 'admin', 'app'];

    reserved.forEach(subdomain => {
      const result = validateSubdomain(subdomain);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('reserved');
    });
  });

  test('should reject invalid characters', () => {
    const invalid = ['acme!', 'acme_corp', 'acme corp', 'ACME'];

    invalid.forEach(subdomain => {
      const result = validateSubdomain(subdomain);
      expect(result.valid).toBe(false);
    });
  });

  test('should extract subdomain from hostname', () => {
    expect(extractSubdomain('acme.yourcrm.com')).toBe('acme');
    expect(extractSubdomain('test.yourcrm.com')).toBe('test');
    expect(extractSubdomain('www.yourcrm.com')).toBeNull();
    expect(extractSubdomain('yourcrm.com')).toBeNull();
    expect(extractSubdomain('localhost')).toBeNull();
  });
});
```

**File**: `__tests__/integration/tenant.test.ts` (NEW FILE)

```typescript
import { renderHook, act } from '@testing-library/react';
import { useTenantStore } from '@/lib/stores/tenantStore';

describe('Tenant Store', () => {
  beforeEach(() => {
    const store = useTenantStore.getState();
    act(() => {
      store.clearTenant();
    });
  });

  test('should set tenant data', () => {
    const { result } = renderHook(() => useTenantStore());

    act(() => {
      result.current.setTenant({
        tenantId: 'tenant-123',
        organizationId: 'org-123',
        organizationName: 'Test Org',
        subdomain: 'testorg',
      });
    });

    expect(result.current.tenantId).toBe('tenant-123');
    expect(result.current.organizationName).toBe('Test Org');
    expect(result.current.isLoaded).toBe(true);
  });

  test('should clear tenant data', () => {
    const { result } = renderHook(() => useTenantStore());

    act(() => {
      result.current.setTenant({
        tenantId: 'tenant-123',
        organizationName: 'Test Org',
      });
    });

    expect(result.current.tenantId).toBe('tenant-123');

    act(() => {
      result.current.clearTenant();
    });

    expect(result.current.tenantId).toBeNull();
    expect(result.current.organizationName).toBeNull();
    expect(result.current.isLoaded).toBe(false);
  });

  test('should update settings', () => {
    const { result } = renderHook(() => useTenantStore());

    act(() => {
      result.current.updateSettings({
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        language: 'en',
        emailNotificationsEnabled: true,
      });
    });

    expect(result.current.settings?.dateFormat).toBe('MM/DD/YYYY');
    expect(result.current.settings?.language).toBe('en');
  });
});
```

**File**: `package.json` (UPDATE)

Add test script:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Acceptance Criteria
- [x] Jest configured
- [x] Auth tests passing
- [x] Organization tests passing
- [x] Tenant store tests passing
- [x] Test coverage report available
- [x] All tests documented

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Expected output:
# PASS  __tests__/integration/auth.test.ts
# PASS  __tests__/integration/organization.test.ts
# PASS  __tests__/integration/tenant.test.ts
```

---

## Production Deployment Checklist

Before deploying to production, ensure:

### Environment Variables
- [ ] `NEXT_PUBLIC_API_URL` - Backend API URL
- [ ] `NEXT_PUBLIC_BASE_URL` - Your domain (for subdomains)
- [ ] Error tracking service configured (Sentry, LogRocket, etc.)

### Security
- [ ] All API endpoints use HTTPS
- [ ] JWT tokens properly validated
- [ ] No sensitive data in localStorage
- [ ] CORS configured correctly
- [ ] Rate limiting implemented

### Testing
- [ ] All integration tests pass
- [ ] Manual testing completed
- [ ] Error boundaries tested
- [ ] Mobile responsive tested
- [ ] Cross-browser tested

### Performance
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] API calls optimized
- [ ] Loading states everywhere
- [ ] Error states everywhere

### Multi-Tenancy Specific
- [ ] Subdomain routing works
- [ ] Tenant isolation verified
- [ ] Data access validated per tenant
- [ ] Organization limits enforced
- [ ] Invitation flow tested

### Documentation
- [ ] API documentation updated
- [ ] User guide created
- [ ] Admin guide created
- [ ] Deployment guide written

---

## Phase 6 Complete!

You now have a production-ready multi-tenant CRM with:
- Comprehensive error handling
- Graceful error recovery
- Integration test coverage
- Production deployment checklist
- Professional error boundaries

---

## Final Implementation Summary

### What You've Built (All 6 Phases)

**Phase 1 - Core Multi-Tenancy**
- JWT utilities with tenant extraction
- Tenant state management (Zustand)
- Tenant context provider
- Updated auth service
- Validated API client

**Phase 2 - Organization Registration**
- Subdomain utilities
- Organization API
- Registration page
- Subdomain validation

**Phase 3 - Organization Management**
- Settings page
- Usage limits tracking
- Profile management
- Subscription info

**Phase 4 - Team Invitations**
- Invitation API
- Invite modal
- Invitations list
- Accept invitation flow
- Team page

**Phase 5 - Analytics Dashboard**
- Analytics API
- Dashboard stats
- Growth trends
- Analytics page
- Dashboard integration

**Phase 6 - Polish & Testing**
- Error boundaries
- Integration tests
- Production readiness

---

## Congratulations!

You have successfully implemented **complete multi-tenancy** support in your frontend CRM application!

**Total Tasks Completed**: 30
**Total Time Investment**: 15-20 days
**Lines of Code**: ~8,000+

Your application now supports:
- Multiple organizations with isolated data
- Subdomain-based multi-tenancy
- Team collaboration with invitations
- Comprehensive analytics
- Production-ready error handling
- Test coverage

**Next Steps**:
1. Deploy to staging environment
2. Perform UAT (User Acceptance Testing)
3. Deploy to production
4. Monitor error tracking
5. Gather user feedback
6. Plan Phase 7 enhancements (if needed)

**Recommended Enhancements** (Future):
- Advanced analytics with charts
- Role-based access control (RBAC) UI
- Audit log viewer
- Data export functionality
- Custom branding per tenant
- Webhooks management
- API key management
- Mobile app

---

**Last Updated**: 2026-02-10
**Version**: 1.0
**Status**: Production Ready
