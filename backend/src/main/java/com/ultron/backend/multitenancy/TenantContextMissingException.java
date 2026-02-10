package com.ultron.backend.multitenancy;

/**
 * Exception thrown when tenant context is required but not available
 * This typically indicates a security issue or misconfiguration
 */
public class TenantContextMissingException extends RuntimeException {

    public TenantContextMissingException(String message) {
        super(message);
    }

    public TenantContextMissingException(String message, Throwable cause) {
        super(message, cause);
    }
}
