package com.ultron.backend.security;

import com.ultron.backend.service.PermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.io.Serializable;

/**
 * Custom PermissionEvaluator for Spring Security.
 * Integrates with PermissionService to check permissions.
 *
 * Usage in controllers:
 * @PreAuthorize("hasPermission('USER', 'CREATE')")
 * @PreAuthorize("hasPermission(#id, 'USER', 'EDIT')")
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CustomPermissionEvaluator implements PermissionEvaluator {

    private final PermissionService permissionService;

    /**
     * Check permission on an object.
     *
     * @param authentication User authentication
     * @param targetDomainObject Target object or object name
     * @param permission Permission string (CREATE, READ, EDIT, DELETE)
     * @return true if user has permission
     */
    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        if (authentication == null || !authentication.isAuthenticated()) {
            log.debug("User not authenticated");
            return false;
        }

        String userId = authentication.getName();
        String objectName = targetDomainObject.toString();
        String action = permission.toString();

        log.debug("Permission check: userId={}, object={}, action={}", userId, objectName, action);

        try {
            return permissionService.hasPermission(userId, objectName, action);
        } catch (Exception e) {
            log.error("Error checking permission", e);
            return false;
        }
    }

    /**
     * Check permission on an object with ID.
     *
     * @param authentication User authentication
     * @param targetId Target object ID
     * @param targetType Target object type (USER, LEAD, ACCOUNT, etc.)
     * @param permission Permission string
     * @return true if user has permission
     */
    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        String userId = authentication.getName();
        String objectName = targetType;
        String action = permission.toString();

        log.debug("Permission check with ID: userId={}, targetId={}, objectType={}, action={}",
                userId, targetId, objectName, action);

        try {
            // For record-level checks, you would fetch the record and check ownership
            // For now, delegate to object-level permission
            return permissionService.hasPermission(userId, objectName, action);
        } catch (Exception e) {
            log.error("Error checking permission with ID", e);
            return false;
        }
    }
}
