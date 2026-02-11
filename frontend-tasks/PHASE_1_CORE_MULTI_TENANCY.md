# Phase 1: Core Multi-Tenancy (Critical)

## Overview

**Duration**: 4 days
**Tasks**: 9 (TASK-001 to TASK-009)
**Priority**: 🔴 Critical
**Dependencies**: None - Start here!

This phase builds the **foundation** for multi-tenancy. Without these tasks, the application cannot support multiple organizations.

---

## What You'll Build

1. ✅ Type definitions for tenant/organization
2. ✅ JWT utilities (decode, validate, extract tenantId)
3. ✅ Tenant state management (Zustand store)
4. ✅ Tenant context provider (React context)
5. ✅ Custom hooks for tenant access
6. ✅ Updated auth service with tenantId
7. ✅ API client with token validation
8. ✅ Full integration in app layout

---

## Success Criteria

By the end of Phase 1, you will have:
- [x] TenantId extracted from JWT on every login
- [x] Tenant state stored globally (Zustand)
- [x] All API calls validated for tenantId
- [x] Automatic logout if token invalid
- [x] Organization context available to all components

---

## Task List

- [TASK-001](#task-001-update-auth-types-to-include-tenantid) - Update Auth Types (30 min)
- [TASK-002](#task-002-create-organization-types) - Create Organization Types (45 min)
- [TASK-003](#task-003-create-jwt-utilities) - Create JWT Utilities (1 hour)
- [TASK-004](#task-004-create-tenant-store-zustand) - Create Tenant Store (1 hour)
- [TASK-005](#task-005-create-tenant-provider) - Create Tenant Provider (1.5 hours)
- [TASK-006](#task-006-create-usetenant-hook) - Create useTenant Hook (30 min)
- [TASK-007](#task-007-update-auth-service) - Update Auth Service (1 hour)
- [TASK-008](#task-008-update-api-client) - Update API Client (45 min)
- [TASK-009](#task-009-integrate-tenant-provider) - Integrate Provider (30 min)

**Total Time**: ~7.5 hours actual coding + testing

---

## TASK-001: Update Auth Types to Include TenantId

**Priority**: 🔴 Critical
**Estimated Time**: 30 minutes
**Dependencies**: None
**Files**: `types/auth.ts` (UPDATE)

### Description
Update authentication types to include tenant and organization information.

### Requirements
1. Add `tenantId` to `User` interface
2. Add `organizationId`, `organizationName`, `tenantId` to `AuthResponse`
3. Keep backward compatibility

### Implementation

**File**: `types/auth.ts` (UPDATE)

```typescript
export interface User {
  userId: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "MANAGER" | "SALES_REP" | "USER";
  tenantId?: string;  // ADD
  organizationId?: string;  // ADD
  organizationName?: string;  // ADD
}

export interface AuthResponse {
  userId: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "MANAGER" | "SALES_REP" | "USER";
  token: string;
  tenantId?: string;  // ADD - Backend sends this
  organizationId?: string;  // ADD - Backend sends this
  organizationName?: string;  // ADD - Backend sends this
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
```

### Acceptance Criteria
- [x] `User` interface includes `tenantId`, `organizationId`, `organizationName`
- [x] `AuthResponse` interface includes tenant fields
- [x] All fields are optional (backward compatible)
- [x] No TypeScript errors in project

### Testing
```bash
# Check types compile
npm run build
```

---

## TASK-002: Create Organization Types

**Priority**: 🔴 Critical
**Estimated Time**: 45 minutes
**Dependencies**: None
**Files**: `types/organization.ts` (NEW)

### Description
Create TypeScript types for organization-related data structures.

### Requirements
1. Create organization types matching backend DTOs
2. Include all nested types
3. Export all types

### Implementation

**File**: `types/organization.ts` (NEW FILE)

```typescript
export interface Organization {
  organizationId: string;
  organizationName: string;
  displayName?: string;
  subdomain: string;
  industry?: string;
  companySize?: string;
  primaryEmail: string;
  primaryPhone?: string;
  status: OrganizationStatus;
  subscription?: SubscriptionInfo;
  limits?: UsageLimits;
  usage?: UsageMetrics;
  settings?: OrganizationSettings;
  security?: SecuritySettings;
  createdAt: string;
}

export type OrganizationStatus =
  | "TRIAL"
  | "ACTIVE"
  | "SUSPENDED"
  | "EXPIRED"
  | "CANCELLED";

export interface SubscriptionInfo {
  planType: string;
  startDate: string;
  endDate?: string;
  trialEndDate?: string;
  monthlyPrice?: number;
  billingCycle: "MONTHLY" | "QUARTERLY" | "ANNUAL";
  paymentStatus: "ACTIVE" | "PAST_DUE" | "CANCELLED";
}

export interface UsageLimits {
  maxUsers: number;
  maxLeads: number;
  maxContacts: number;
  maxAccounts: number;
  maxOpportunities: number;
  maxProducts: number;
  maxStorageMB: number;
  maxApiCallsPerDay: number;
  customFieldsEnabled: boolean;
  apiAccessEnabled: boolean;
  advancedReportsEnabled: boolean;
}

export interface UsageMetrics {
  currentUsers: number;
  currentLeads: number;
  currentContacts: number;
  currentAccounts: number;
  currentOpportunities: number;
  currentProducts: number;
  currentStorageMB: number;
  apiCallsToday: number;
  lastCalculated: string;
}

export interface OrganizationSettings {
  dateFormat: string;
  timeFormat: string;
  language: string;
  emailNotificationsEnabled: boolean;
  logoUrl?: string;
  brandColor?: string;
}

export interface SecuritySettings {
  twoFactorRequired: boolean;
  ipWhitelistEnabled: boolean;
  allowedIPs?: string[];
  sessionTimeoutMinutes: number;
  passwordExpiryDays?: number;
  auditLogEnabled: boolean;
  encryptionEnabled: boolean;
}

// Organization Registration
export interface OrganizationRegistrationRequest {
  organizationName: string;
  subdomain: string;
  industry?: string;
  companySize?: string;
  adminEmail: string;
  adminPassword: string;
  adminFullName: string;
}

export interface OrganizationRegistrationResponse {
  organizationId: string;
  tenantId: string;
  userId: string;
  token: string;
  message: string;
}

// Subdomain Check
export interface SubdomainAvailability {
  subdomain: string;
  available: boolean;
  message: string;
}

// Organization Usage
export interface OrganizationUsage {
  limits: UsageLimits;
  usage: UsageMetrics;
  subscriptionTier: string;
  status: OrganizationStatus;
}

// Invitations
export interface InvitationRequest {
  email: string;
  roleId?: string;
  roleName: string;
  profileId?: string;
  profileName?: string;
  personalMessage?: string;
}

export interface Invitation {
  invitationId: string;
  email: string;
  organizationName: string;
  organizationId: string;
  invitedByName: string;
  roleName: string;
  profileName?: string;
  status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
  personalMessage?: string;
  sentAt: string;
  expiresAt: string;
  isExpired: boolean;
}

export interface AcceptInvitationRequest {
  fullName: string;
  password: string;
}

// Analytics
export interface DashboardStats {
  totalLeads: number;
  totalContacts: number;
  totalOpportunities: number;
  totalActivities: number;
}

export interface GrowthTrends {
  period: string;
  leadGrowth: number;
  contactGrowth: number;
  opportunityGrowth: number;
}
```

### Acceptance Criteria
- [x] All types match backend DTOs
- [x] No TypeScript errors
- [x] Types are properly exported
- [x] Nested types are defined

### Testing
```bash
npm run build
```

---

## TASK-003: Create JWT Utilities

**Priority**: 🔴 Critical
**Estimated Time**: 1 hour
**Dependencies**: TASK-001
**Files**: `lib/utils/jwt.ts` (NEW)

### Description
Create utilities for decoding and validating JWT tokens, especially extracting tenantId.

### Requirements
1. Decode JWT without external library
2. Extract tenantId from JWT payload
3. Validate JWT expiry
4. Validate tenantId presence

### Implementation

**File**: `lib/utils/jwt.ts` (NEW FILE)

```typescript
interface JWTPayload {
  sub: string;        // userId
  email: string;
  role: string;
  tenantId?: string;  // Multi-tenancy claim
  exp: number;
  iat: number;
}

/**
 * Base64 URL decode
 */
function base64UrlDecode(str: string): string {
  // Replace URL-safe characters
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding
  while (base64.length % 4) {
    base64 += '=';
  }

  try {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    return '';
  }
}

/**
 * Decode JWT token
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');

    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }

    const payload = base64UrlDecode(parts[1]);
    return JSON.parse(payload) as JWTPayload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Extract tenantId from JWT
 */
export function extractTenantId(token: string): string | null {
  const payload = decodeJWT(token);
  return payload?.tenantId || null;
}

/**
 * Extract userId from JWT
 */
export function extractUserId(token: string): string | null {
  const payload = decodeJWT(token);
  return payload?.sub || null;
}

/**
 * Extract email from JWT
 */
export function extractEmail(token: string): string | null {
  const payload = decodeJWT(token);
  return payload?.email || null;
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}

/**
 * Validate token has required multi-tenancy fields
 */
export function validateToken(token: string): boolean {
  const payload = decodeJWT(token);

  if (!payload) {
    console.error('Invalid JWT payload');
    return false;
  }

  // Must have tenantId for multi-tenancy
  if (!payload.tenantId) {
    console.error('JWT missing tenantId claim - multi-tenancy not supported');
    return false;
  }

  // Check expiry
  if (isTokenExpired(token)) {
    console.error('JWT token expired');
    return false;
  }

  return true;
}

/**
 * Get time until token expires (in seconds)
 */
export function getTokenExpiryTime(token: string): number {
  const payload = decodeJWT(token);
  if (!payload) return 0;

  const currentTime = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - currentTime);
}

/**
 * Check if token will expire soon (within 5 minutes)
 */
export function isTokenExpiringSoon(token: string): boolean {
  const expiryTime = getTokenExpiryTime(token);
  return expiryTime > 0 && expiryTime < 300; // 5 minutes
}
```

### Acceptance Criteria
- [x] Can decode JWT without external library
- [x] Extracts tenantId correctly
- [x] Validates token expiry
- [x] Returns null for invalid tokens
- [x] Proper error handling
- [x] TypeScript types are correct

### Testing
```typescript
// Test in browser console
import { decodeJWT, extractTenantId, validateToken } from '@/lib/utils/jwt';

const token = localStorage.getItem('auth_token');
console.log('Payload:', decodeJWT(token));
console.log('TenantId:', extractTenantId(token));
console.log('Valid:', validateToken(token));
```

---

## TASK-004: Create Tenant Store (Zustand)

**Priority**: 🔴 Critical
**Estimated Time**: 1 hour
**Dependencies**: TASK-002
**Files**: `lib/stores/tenantStore.ts` (NEW)

### Description
Create Zustand store for managing tenant/organization state globally.

### Requirements
1. Install Zustand if not installed
2. Create tenant state store
3. Persist tenant data
4. Provide actions for updating tenant state

### Implementation

**Step 1**: Install Zustand

```bash
npm install zustand
```

**Step 2**: Create Store

**File**: `lib/stores/tenantStore.ts` (NEW FILE)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  OrganizationSettings,
  SubscriptionInfo,
  UsageLimits,
  UsageMetrics
} from '@/types/organization';

interface TenantState {
  // Tenant Information
  tenantId: string | null;
  organizationId: string | null;
  organizationName: string | null;
  subdomain: string | null;

  // Organization Details
  settings: OrganizationSettings | null;
  subscription: SubscriptionInfo | null;
  limits: UsageLimits | null;
  usage: UsageMetrics | null;

  // Loading State
  isLoading: boolean;
  isLoaded: boolean;

  // Actions
  setTenant: (tenant: Partial<TenantState>) => void;
  updateSettings: (settings: OrganizationSettings) => void;
  updateSubscription: (subscription: SubscriptionInfo) => void;
  updateUsage: (usage: UsageMetrics) => void;
  clearTenant: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      // Initial State
      tenantId: null,
      organizationId: null,
      organizationName: null,
      subdomain: null,
      settings: null,
      subscription: null,
      limits: null,
      usage: null,
      isLoading: false,
      isLoaded: false,

      // Actions
      setTenant: (tenant) => set((state) => ({
        ...state,
        ...tenant,
        isLoaded: true,
      })),

      updateSettings: (settings) => set((state) => ({
        ...state,
        settings: { ...state.settings, ...settings },
      })),

      updateSubscription: (subscription) => set((state) => ({
        ...state,
        subscription: { ...state.subscription, ...subscription },
      })),

      updateUsage: (usage) => set((state) => ({
        ...state,
        usage: { ...state.usage, ...usage },
      })),

      clearTenant: () => set({
        tenantId: null,
        organizationId: null,
        organizationName: null,
        subdomain: null,
        settings: null,
        subscription: null,
        limits: null,
        usage: null,
        isLoading: false,
        isLoaded: false,
      }),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'tenant-storage',
      // Only persist essential tenant info
      partialize: (state) => ({
        tenantId: state.tenantId,
        organizationId: state.organizationId,
        organizationName: state.organizationName,
        subdomain: state.subdomain,
      }),
    }
  )
);

// Selectors
export const selectTenantId = (state: TenantState) => state.tenantId;
export const selectOrganizationName = (state: TenantState) => state.organizationName;
export const selectSettings = (state: TenantState) => state.settings;
export const selectSubscription = (state: TenantState) => state.subscription;
export const selectUsage = (state: TenantState) => state.usage;
export const selectLimits = (state: TenantState) => state.limits;
export const selectIsLoaded = (state: TenantState) => state.isLoaded;
```

### Acceptance Criteria
- [x] Zustand installed
- [x] Store created with all tenant fields
- [x] State persists to localStorage
- [x] Actions work correctly
- [x] Selectors provided
- [x] TypeScript types correct

### Testing
```typescript
// Test in React component
import { useTenantStore } from '@/lib/stores/tenantStore';

function TestComponent() {
  const { tenantId, setTenant } = useTenantStore();

  const handleTest = () => {
    setTenant({
      tenantId: 'test-123',
      organizationName: 'Test Org',
    });
  };

  return (
    <div>
      <p>Tenant ID: {tenantId}</p>
      <button onClick={handleTest}>Set Tenant</button>
    </div>
  );
}
```

---

## TASK-005: Create Tenant Provider

**Priority**: 🔴 Critical
**Estimated Time**: 1.5 hours
**Dependencies**: TASK-003, TASK-004, TASK-011 (from Phase 2)
**Files**: `providers/TenantProvider.tsx` (NEW)

### Description
Create React context provider that loads and manages tenant data.

### Requirements
1. Load organization details on mount
2. Extract tenantId from JWT
3. Update tenant store
4. Provide loading state

### Implementation

**File**: `providers/TenantProvider.tsx` (NEW FILE)

```typescript
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useTenantStore } from '@/lib/stores/tenantStore';
import { extractTenantId, validateToken } from '@/lib/utils/jwt';
import { organizationApi } from '@/lib/api/organization';
import { authService } from '@/lib/auth';

interface TenantContextType {
  tenantId: string | null;
  organizationName: string | null;
  subdomain: string | null;
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    tenantId,
    organizationName,
    subdomain,
    isLoading,
    isLoaded,
    setTenant,
    setLoading,
    clearTenant,
  } = useTenantStore();

  const loadOrganizationDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get token
      const token = authService.getToken();
      if (!token) {
        console.log('No token found, skipping tenant load');
        setLoading(false);
        return;
      }

      // Validate token has tenantId
      if (!validateToken(token)) {
        console.error('Invalid token or missing tenantId');
        clearTenant();
        authService.logout();
        return;
      }

      // Extract tenantId from JWT
      const tokenTenantId = extractTenantId(token);
      if (!tokenTenantId) {
        console.error('No tenantId in JWT token');
        clearTenant();
        setLoading(false);
        return;
      }

      // Check if tenantId changed (multi-org support)
      if (tenantId && tenantId !== tokenTenantId) {
        console.log('Tenant changed, reloading');
        clearTenant();
      }

      // Fetch organization details from API
      const orgDetails = await organizationApi.getCurrent();

      // Update tenant store
      setTenant({
        tenantId: tokenTenantId,
        organizationId: orgDetails.organizationId,
        organizationName: orgDetails.organizationName,
        subdomain: orgDetails.subdomain,
        settings: orgDetails.settings,
        subscription: orgDetails.subscription,
        limits: orgDetails.limits,
        usage: orgDetails.usage,
      });

      console.log('Tenant loaded:', orgDetails.organizationName);
    } catch (err: any) {
      console.error('Failed to load organization details:', err);
      setError(err.message || 'Failed to load organization');

      // If 401/403, logout
      if (err.status === 401 || err.status === 403) {
        clearTenant();
        authService.logout();
      }
    } finally {
      setLoading(false);
    }
  };

  // Load tenant on mount and when auth changes
  useEffect(() => {
    const token = authService.getToken();

    if (token && !isLoaded && !isLoading) {
      loadOrganizationDetails();
    } else if (!token && isLoaded) {
      // Token removed, clear tenant
      clearTenant();
    }
  }, []); // Run once on mount

  const value: TenantContextType = {
    tenantId,
    organizationName,
    subdomain,
    isLoading,
    isLoaded,
    error,
    refreshTenant: loadOrganizationDetails,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Hook to access tenant context
 */
export function useTenantContext() {
  const context = useContext(TenantContext);

  if (context === undefined) {
    throw new Error('useTenantContext must be used within TenantProvider');
  }

  return context;
}
```

### Acceptance Criteria
- [x] Provider loads organization on mount
- [x] Extracts tenantId from JWT
- [x] Updates tenant store
- [x] Handles errors gracefully
- [x] Provides loading state
- [x] Clears tenant on logout

### Testing
```typescript
// Wrap app with provider and test
import { TenantProvider, useTenantContext } from '@/providers/TenantProvider';

function TestComponent() {
  const { organizationName, isLoading } = useTenantContext();

  if (isLoading) return <div>Loading...</div>;

  return <div>Organization: {organizationName}</div>;
}

function App() {
  return (
    <TenantProvider>
      <TestComponent />
    </TenantProvider>
  );
}
```

---

## TASK-006: Create useTenant Hook

**Priority**: 🔴 Critical
**Estimated Time**: 30 minutes
**Dependencies**: TASK-004, TASK-005
**Files**: `lib/hooks/useTenant.ts` (NEW)

### Description
Create custom React hook for easy access to tenant state.

### Requirements
1. Access tenant store
2. Provide convenient interface
3. Include computed properties

### Implementation

**File**: `lib/hooks/useTenant.ts` (NEW FILE)

```typescript
import { useTenantStore, selectTenantId, selectOrganizationName, selectSettings, selectSubscription, selectUsage, selectLimits, selectIsLoaded } from '@/lib/stores/tenantStore';

/**
 * Hook to access tenant state
 */
export function useTenant() {
  const tenantId = useTenantStore(selectTenantId);
  const organizationId = useTenantStore((state) => state.organizationId);
  const organizationName = useTenantStore(selectOrganizationName);
  const subdomain = useTenantStore((state) => state.subdomain);
  const settings = useTenantStore(selectSettings);
  const subscription = useTenantStore(selectSubscription);
  const usage = useTenantStore(selectUsage);
  const limits = useTenantStore(selectLimits);
  const isLoaded = useTenantStore(selectIsLoaded);
  const isLoading = useTenantStore((state) => state.isLoading);

  return {
    // Basic Info
    tenantId,
    organizationId,
    organizationName,
    subdomain,

    // Details
    settings,
    subscription,
    usage,
    limits,

    // State
    isLoaded,
    isLoading,

    // Computed
    hasOrganization: !!tenantId,
    isTrialAccount: subscription?.planType === 'TRIAL',
    isActiveSubscription: subscription?.paymentStatus === 'ACTIVE',
  };
}

/**
 * Hook to access tenant settings
 */
export function useTenantSettings() {
  const settings = useTenantStore(selectSettings);

  return {
    settings,
    dateFormat: settings?.dateFormat || 'DD/MM/YYYY',
    timeFormat: settings?.timeFormat || 'HH:mm',
    language: settings?.language || 'en',
    logoUrl: settings?.logoUrl,
    brandColor: settings?.brandColor,
  };
}

/**
 * Hook to access usage limits
 */
export function useUsageLimits() {
  const usage = useTenantStore(selectUsage);
  const limits = useTenantStore(selectLimits);

  const getUsagePercentage = (resource: string) => {
    if (!usage || !limits) return 0;

    const currentKey = `current${resource}` as keyof typeof usage;
    const maxKey = `max${resource}` as keyof typeof limits;

    const current = (usage[currentKey] as number) || 0;
    const max = (limits[maxKey] as number) || 1;

    return Math.round((current / max) * 100);
  };

  const isNearLimit = (resource: string, threshold = 80) => {
    return getUsagePercentage(resource) >= threshold;
  };

  const hasExceededLimit = (resource: string) => {
    return getUsagePercentage(resource) >= 100;
  };

  return {
    usage,
    limits,
    getUsagePercentage,
    isNearLimit,
    hasExceededLimit,
  };
}
```

### Acceptance Criteria
- [x] Hook provides easy access to tenant state
- [x] Includes computed properties
- [x] Separate hooks for settings and usage
- [x] TypeScript types correct
- [x] Re-renders optimized (using selectors)

### Testing
```typescript
import { useTenant, useUsageLimits } from '@/lib/hooks/useTenant';

function TestComponent() {
  const { organizationName, isTrialAccount } = useTenant();
  const { getUsagePercentage, isNearLimit } = useUsageLimits();

  return (
    <div>
      <h1>{organizationName}</h1>
      {isTrialAccount && <p>Trial Account</p>}
      <p>Leads: {getUsagePercentage('Leads')}%</p>
      {isNearLimit('Leads') && <p>Warning: Near limit</p>}
    </div>
  );
}
```

---

## TASK-007: Update Auth Service

**Priority**: 🔴 Critical
**Estimated Time**: 1 hour
**Dependencies**: TASK-001, TASK-003
**Files**: `lib/auth.ts` (UPDATE)

### Description
Update auth service to extract and store tenantId from JWT.

### Requirements
1. Extract tenantId from auth response
2. Store tenantId in localStorage
3. Update User object with tenant info
4. Validate JWT contains tenantId

### Implementation

Replace the entire setAuth method and add new methods:

**File**: `lib/auth.ts` (UPDATE)

Add imports at the top:
```typescript
import { extractTenantId, validateToken } from "./utils/jwt";  // ADD
```

Update the `setAuth` method:
```typescript
setAuth(authResponse: AuthResponse): void {
  // Validate token contains tenantId (ADD)
  if (!validateToken(authResponse.token)) {
    console.error('Invalid token or missing tenantId');
    throw new Error('Invalid authentication token');
  }

  // Extract tenantId from JWT (ADD)
  const tenantId = extractTenantId(authResponse.token);

  // Store token in localStorage
  localStorage.setItem("auth_token", authResponse.token);

  // Create user object with tenant info (UPDATE)
  const user: User = {
    userId: authResponse.userId,
    email: authResponse.email,
    fullName: authResponse.fullName,
    role: authResponse.role,
    tenantId: tenantId || undefined,  // ADD
    organizationId: authResponse.organizationId,  // ADD
    organizationName: authResponse.organizationName,  // ADD
  };

  localStorage.setItem("user", JSON.stringify(user));

  // Also store token in cookie for middleware to access
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 7);
  document.cookie = `auth_token=${authResponse.token}; path=/; expires=${expirationDate.toUTCString()}; SameSite=Strict`;
},
```

Update the `isAuthenticated` method:
```typescript
isAuthenticated(): boolean {
  const token = this.getToken();
  if (token) {
    // Validate token contains tenantId (ADD)
    if (!validateToken(token)) {
      this.logout();
      return false;
    }

    // Ensure cookie is also set (for existing logged-in users)
    if (!document.cookie.includes("auth_token=")) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);
      document.cookie = `auth_token=${token}; path=/; expires=${expirationDate.toUTCString()}; SameSite=Strict`;
    }
    return true;
  }
  return false;
},
```

Add new method at the end:
```typescript
// ADD: Get tenantId from token
getTenantId(): string | null {
  const token = this.getToken();
  if (!token) return null;
  return extractTenantId(token);
},
```

### Acceptance Criteria
- [x] Extracts tenantId from JWT
- [x] Validates token contains tenantId
- [x] Stores tenant info in user object
- [x] Logs out if token invalid
- [x] New `getTenantId()` method added

### Testing
```bash
# Test login
1. Login with valid credentials
2. Check localStorage user object has tenantId
3. Check getTenantId() returns correct value
4. Check console for validation messages
```

---

## TASK-008: Update API Client

**Priority**: 🔴 Critical
**Estimated Time**: 45 minutes
**Dependencies**: TASK-003, TASK-007
**Files**: `lib/api-client.ts` (UPDATE)

### Description
Update API client to validate token before making requests.

### Requirements
1. Validate JWT before each request
2. Check tenantId presence
3. Auto-logout on invalid token
4. Better error messages

### Implementation

**File**: `lib/api-client.ts` (UPDATE)

Add imports at the top:
```typescript
import { validateToken, isTokenExpired } from "./utils/jwt";  // ADD
```

Update the `apiRequest` function - add validation before making request:
```typescript
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("auth_token");

  // Validate token before making request (ADD)
  if (token && !endpoint.includes("/auth/")) {
    // Check if token is expired
    if (isTokenExpired(token)) {
      console.error('Token expired, logging out');
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new ApiError("Session expired", 401);
    }

    // Validate token structure and tenantId presence
    if (!validateToken(token)) {
      console.error('Invalid token or missing tenantId');
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new ApiError("Invalid authentication", 401);
    }
  }

  // ... rest of the existing function
}
```

In the response handling section, add better 403 handling:
```typescript
if (!response.ok) {
  if (response.status === 401) {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  // ADD: Handle 403 (tenant mismatch or permission denied)
  if (response.status === 403) {
    console.error('Access denied - possible tenant mismatch');
  }

  throw new ApiError(data.message || "An error occurred", response.status, data.errors);
}
```

Update the `upload` method to validate token:
```typescript
upload: async <T>(endpoint: string, formData: FormData): Promise<T> => {
  const token = localStorage.getItem("auth_token");

  // ADD: Validate token for uploads too
  if (token && !validateToken(token)) {
    console.error('Invalid token for upload');
    throw new ApiError("Invalid authentication", 401);
  }

  // ... rest of the existing method
}
```

Update the `download` method to validate token:
```typescript
download: async (endpoint: string): Promise<Blob> => {
  const token = localStorage.getItem("auth_token");

  // ADD: Validate token for downloads
  if (token && !validateToken(token)) {
    console.error('Invalid token for download');
    throw new ApiError("Invalid authentication", 401);
  }

  // ... rest of the existing method
}
```

### Acceptance Criteria
- [x] Validates token before each request
- [x] Checks token expiry
- [x] Validates tenantId presence
- [x] Auto-logout on invalid token
- [x] Handles 403 errors properly
- [x] Applied to upload/download methods

### Testing
```bash
# Test API validation
1. Login normally
2. Make API call - should work
3. Clear tenantId from token (manually)
4. Make API call - should logout
5. Check console for error messages
```

---

## TASK-009: Integrate Tenant Provider

**Priority**: 🔴 Critical
**Estimated Time**: 30 minutes
**Dependencies**: TASK-005
**Files**: `app/layout.tsx` (UPDATE)

### Description
Integrate TenantProvider into root layout.

### Requirements
1. Wrap app with TenantProvider
2. Ensure it's inside ToastProvider
3. Only wrap protected routes

### Implementation

**File**: `app/layout.tsx` (UPDATE)

Add import:
```typescript
import { TenantProvider } from "@/providers/TenantProvider";  // ADD
```

Update the return statement to wrap children with TenantProvider:
```typescript
return (
  <html lang="en">
    <body
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <ToastProvider>
        <TenantProvider>  {/* ADD */}
          {children}
        </TenantProvider>  {/* ADD */}
      </ToastProvider>
    </body>
  </html>
);
```

### Acceptance Criteria
- [x] TenantProvider wraps entire app
- [x] Placed after ToastProvider
- [x] No TypeScript errors
- [x] App still renders correctly

### Testing
```bash
1. Run app: npm run dev
2. Login with valid credentials
3. Check browser console for "Tenant loaded" message
4. Check React DevTools for TenantProvider
5. Verify tenant state in Components tab
```

---

## Phase 1 Complete! 🎉

You now have a fully functional multi-tenant foundation. All components can access tenant information through:
- `useTenant()` hook
- `useTenantContext()` hook
- `useTenantStore()` directly

**Next Step**: Move to [Phase 2: Organization Registration](./PHASE_2_ORGANIZATION_REGISTRATION.md)
