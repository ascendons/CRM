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
