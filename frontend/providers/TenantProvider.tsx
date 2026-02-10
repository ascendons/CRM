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
            // Note: This API endpoint needs to be implemented on backend
            // Just logging for now if fails
            try {
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
            } catch (apiError) {
                console.warn('Failed to fetch org details (backend might not be ready):', apiError);
                // Still set tenantId from token so app can function locally/partially
                setTenant({
                    tenantId: tokenTenantId
                });
            }

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

    // Load tenant on mount
    useEffect(() => {
        if (!isLoaded && !isLoading) {
            loadOrganizationDetails();
        }
    }, []);

    const value = {
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

// Hook to use TenantContext
export function useTenant() {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
}
