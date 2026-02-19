"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    ReactNode,
} from "react";
import { organizationApi } from "@/lib/api/organization";
import type { Organization } from "@/types/organization";
import { authService } from "@/lib/auth";

interface OrganizationContextType {
    organization: Organization | null;
    isLoading: boolean;
    error: string | null;
    refreshOrganization: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
    undefined
);

export function OrganizationProvider({ children }: { children: ReactNode }) {
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadOrganization = useCallback(async () => {
        // Only load if authenticated
        if (!authService.isAuthenticated()) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            const data = await organizationApi.getCurrent();
            setOrganization(data);
        } catch (err: any) {
            console.error("Failed to load organization:", err);
            // Don't set error if it's just a 401/403 (handled by auth)
            if (err.status !== 401 && err.status !== 403) {
                setError(err.message || "Failed to load organization");
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOrganization();
    }, [loadOrganization]);

    const value = {
        organization,
        isLoading,
        error,
        refreshOrganization: loadOrganization,
    };

    return (
        <OrganizationContext.Provider value={value}>
            {children}
        </OrganizationContext.Provider>
    );
}

export function useOrganization() {
    const context = useContext(OrganizationContext);
    if (context === undefined) {
        throw new Error(
            "useOrganization must be used within an OrganizationProvider"
        );
    }
    return context;
}
