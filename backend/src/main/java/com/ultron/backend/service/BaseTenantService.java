package com.ultron.backend.service;

import com.ultron.backend.multitenancy.TenantContext;
import com.ultron.backend.multitenancy.TenantContextMissingException;
import lombok.extern.slf4j.Slf4j;

/**
 * Base service class for tenant-aware operations
 * Provides common utility methods for tenant context access and validation
 *
 * All service classes that handle tenant-scoped data should extend this class
 */
@Slf4j
public abstract class BaseTenantService {

    /**
     * Get current tenant ID from context
     * @return Tenant ID
     * @throws TenantContextMissingException if not set
     */
    protected String getCurrentTenantId() {
        return TenantContext.requireTenantId();
    }

    /**
     * Get current user ID from context
     * @return User ID or null if not set
     */
    protected String getCurrentUserId() {
        String userId = TenantContext.getUserId();
        if (userId == null) {
            log.warn("User ID not set in context");
        }
        return userId;
    }

    /**
     * Get current user role from context
     * @return User role or null if not set
     */
    protected String getCurrentUserRole() {
        return TenantContext.getUserRole();
    }

    /**
     * Check if current user is tenant admin
     * @return true if admin role
     */
    protected boolean isCurrentUserTenantAdmin() {
        String role = TenantContext.getUserRole();
        return role != null && (role.equals("ADMIN") || role.equals("TENANT_ADMIN"));
    }

    /**
     * Check if current user is system admin
     * @return true if system admin
     */
    protected boolean isCurrentUserSystemAdmin() {
        String role = TenantContext.getUserRole();
        return role != null && role.equals("SYSTEM_ADMIN");
    }

    /**
     * Validate tenant context is set
     * Call this at the beginning of methods that require tenant isolation
     * @throws TenantContextMissingException if tenant context not set
     */
    protected void validateTenantContext() {
        if (!TenantContext.isSet()) {
            log.error("Tenant context validation failed - context not set");
            throw new TenantContextMissingException("Tenant context is required but not set");
        }
    }

    /**
     * Log tenant-aware operation for audit trail
     * @param operation Operation name (CREATE, UPDATE, DELETE, etc.)
     * @param entityType Entity type (Lead, Contact, Account, etc.)
     * @param entityId Entity ID
     */
    protected void logTenantOperation(String operation, String entityType, String entityId) {
        log.info("Tenant Operation - tenant={}, user={}, operation={}, entity={}:{}",
                 TenantContext.getTenantId(),
                 TenantContext.getUserId(),
                 operation,
                 entityType,
                 entityId);
    }

    /**
     * Validate that a resource belongs to the current tenant
     * Throws exception if resource has different tenantId
     * @param resourceTenantId The tenantId of the resource being accessed
     * @throws SecurityException if resource belongs to different tenant
     */
    protected void validateResourceTenantOwnership(String resourceTenantId) {
        String currentTenantId = getCurrentTenantId();
        if (resourceTenantId != null && !resourceTenantId.equals(currentTenantId)) {
            log.error("Cross-tenant access attempt: user from tenant {} tried to access resource from tenant {}",
                      currentTenantId, resourceTenantId);
            throw new SecurityException("Access denied: resource belongs to different organization");
        }
    }

    /**
     * Check if user has permission (placeholder for future RBAC enhancement)
     * @param permission Permission string
     * @return true if user has permission
     */
    protected boolean hasPermission(String permission) {
        // Placeholder - can be enhanced with proper RBAC later
        String role = getCurrentUserRole();
        if (role == null) {
            return false;
        }
        // Admins have all permissions
        return isCurrentUserTenantAdmin() || isCurrentUserSystemAdmin();
    }
}
