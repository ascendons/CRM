package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Role;
import com.ultron.backend.domain.entity.User;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.RoleRepository;
import com.ultron.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service to handle data visibility rules based on user roles
 * Implements the dataVisibility field from Role.RolePermissions:
 * - "ALL": Admin can see all data in tenant
 * - "SUBORDINATES": Manager can see own + subordinates' data
 * - "OWN": Employee can see only own data
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DataVisibilityService extends BaseTenantService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionService permissionService;

    /**
     * Get list of user IDs whose data the current user can view
     * Based on the user's role dataVisibility setting
     *
     * @param userId Current user's MongoDB ObjectId
     * @return List of user IDs (MongoDB ObjectIds) this user can view data for
     */
    @Cacheable(value = "dataVisibility", key = "#userId + '_' + T(com.ultron.backend.multitenancy.TenantContext).getTenantId()")
    public List<String> getVisibleUserIds(String userId) {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Getting visible user IDs for user: {}", tenantId, userId);

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Validate tenant ownership
        validateResourceTenantOwnership(user.getTenantId());

        // Get user's role
        Role role = roleRepository.findByRoleIdAndTenantId(user.getRoleId(), tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + user.getRoleId()));

        if (role.getPermissions() == null || role.getPermissions().getDataVisibility() == null) {
            log.warn("[Tenant: {}] Role {} has no dataVisibility setting, defaulting to OWN",
                tenantId, role.getRoleId());
            return Collections.singletonList(userId);
        }

        String dataVisibility = role.getPermissions().getDataVisibility();
        log.debug("[Tenant: {}] User {} has dataVisibility: {}", tenantId, userId, dataVisibility);

        List<String> visibleUserIds;

        switch (dataVisibility) {
            case "ALL":
                // Admin: Can see all users in tenant
                visibleUserIds = userRepository.findByTenantIdAndIsDeletedFalse(tenantId)
                    .stream()
                    .map(User::getId)  // Using MongoDB ObjectId
                    .collect(Collectors.toList());
                log.debug("[Tenant: {}] Admin user {} can see {} users (ALL)",
                    tenantId, userId, visibleUserIds.size());
                break;

            case "SUBORDINATES":
                // Manager: Can see own data + all subordinates' data (recursive)
                List<String> subordinateUserIds = permissionService.getAllSubordinates(user.getUserId());

                // Convert userIds (USR-xxx) to MongoDB ObjectIds
                visibleUserIds = userRepository.findByTenantIdAndIsDeletedFalse(tenantId)
                    .stream()
                    .filter(u -> subordinateUserIds.contains(u.getUserId()) || u.getId().equals(userId))
                    .map(User::getId)
                    .collect(Collectors.toList());

                log.debug("[Tenant: {}] Manager user {} can see {} users (SUBORDINATES)",
                    tenantId, userId, visibleUserIds.size());
                break;

            case "OWN":
                // Employee: Can see only own data
                visibleUserIds = Collections.singletonList(userId);
                log.debug("[Tenant: {}] Employee user {} can see only own data (OWN)",
                    tenantId, userId);
                break;

            default:
                log.warn("[Tenant: {}] Unknown dataVisibility value: {}, defaulting to OWN",
                    tenantId, dataVisibility);
                visibleUserIds = Collections.singletonList(userId);
        }

        return visibleUserIds;
    }

    /**
     * Check if a user can view another user's data
     *
     * @param viewerId MongoDB ObjectId of the user trying to view
     * @param targetUserId MongoDB ObjectId of the user whose data is being viewed
     * @return true if viewer can see target's data
     */
    public boolean canViewUser(String viewerId, String targetUserId) {
        List<String> visibleIds = getVisibleUserIds(viewerId);
        boolean canView = visibleIds.contains(targetUserId);

        if (!canView) {
            log.warn("[Tenant: {}] User {} attempted to view user {} but lacks permission",
                getCurrentTenantId(), viewerId, targetUserId);
        }

        return canView;
    }

    /**
     * Get the data visibility level for a user
     *
     * @param userId MongoDB ObjectId of the user
     * @return "ALL", "SUBORDINATES", or "OWN"
     */
    @Cacheable(value = "userDataVisibility", key = "#userId + '_' + T(com.ultron.backend.multitenancy.TenantContext).getTenantId()")
    public String getDataVisibilityLevel(String userId) {
        String tenantId = getCurrentTenantId();

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Role role = roleRepository.findByRoleIdAndTenantId(user.getRoleId(), tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + user.getRoleId()));

        if (role.getPermissions() == null || role.getPermissions().getDataVisibility() == null) {
            return "OWN";
        }

        return role.getPermissions().getDataVisibility();
    }

    /**
     * Check if user has admin-level access (dataVisibility = "ALL")
     *
     * @param userId MongoDB ObjectId of the user
     * @return true if user has admin access
     */
    public boolean hasAdminAccess(String userId) {
        return "ALL".equals(getDataVisibilityLevel(userId));
    }

    /**
     * Check if user has manager-level access (dataVisibility = "SUBORDINATES")
     *
     * @param userId MongoDB ObjectId of the user
     * @return true if user has manager access
     */
    public boolean hasManagerAccess(String userId) {
        String level = getDataVisibilityLevel(userId);
        return "SUBORDINATES".equals(level) || "ALL".equals(level);
    }
}
