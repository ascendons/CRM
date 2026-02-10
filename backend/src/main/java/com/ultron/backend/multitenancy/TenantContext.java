package com.ultron.backend.multitenancy;

import lombok.extern.slf4j.Slf4j;

/**
 * ThreadLocal storage for tenant context
 * Provides thread-safe storage of current tenant ID across the request lifecycle
 *
 * CRITICAL: Must be cleaned up after each request to prevent memory leaks
 *
 * Usage:
 * - Set tenant context in JWT authentication filter
 * - Access tenant context in services via getCurrentTenantId()
 * - Clear tenant context in finally block of filter
 */
@Slf4j
public final class TenantContext {

    private TenantContext() {
        // Private constructor to prevent instantiation
    }

    private static final ThreadLocal<String> TENANT_ID = new InheritableThreadLocal<>();
    private static final ThreadLocal<String> USER_ID = new InheritableThreadLocal<>();
    private static final ThreadLocal<String> USER_ROLE = new InheritableThreadLocal<>();

    /**
     * Set the current tenant ID
     * @param tenantId The tenant/organization ID
     */
    public static void setTenantId(String tenantId) {
        if (tenantId == null) {
            log.warn("Attempting to set null tenantId - this may indicate a security issue");
        }
        TENANT_ID.set(tenantId);
        log.trace("TenantContext set: tenantId={}", tenantId);
    }

    /**
     * Get the current tenant ID
     * @return The tenant ID or null if not set
     */
    public static String getTenantId() {
        return TENANT_ID.get();
    }

    /**
     * Set the current user ID
     * @param userId The user ID
     */
    public static void setUserId(String userId) {
        USER_ID.set(userId);
    }

    /**
     * Get the current user ID
     * @return The user ID or null if not set
     */
    public static String getUserId() {
        return USER_ID.get();
    }

    /**
     * Set the current user role
     * @param role The user role
     */
    public static void setUserRole(String role) {
        USER_ROLE.set(role);
    }

    /**
     * Get the current user role
     * @return The user role or null if not set
     */
    public static String getUserRole() {
        return USER_ROLE.get();
    }

    /**
     * Clear all thread-local values
     * MUST be called in finally block or filter cleanup
     */
    public static void clear() {
        TENANT_ID.remove();
        USER_ID.remove();
        USER_ROLE.remove();
        log.trace("TenantContext cleared");
    }

    /**
     * Check if tenant context is set
     * @return true if tenant ID is present
     */
    public static boolean isSet() {
        return TENANT_ID.get() != null;
    }

    /**
     * Get tenant ID or throw exception if not set
     * Use this in methods that REQUIRE tenant context
     * @return The tenant ID
     * @throws TenantContextMissingException if tenant context not set
     */
    public static String requireTenantId() {
        String tenantId = TENANT_ID.get();
        if (tenantId == null) {
            throw new TenantContextMissingException("Tenant context is required but not set");
        }
        return tenantId;
    }
}
