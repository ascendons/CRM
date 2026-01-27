package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Profile;
import com.ultron.backend.domain.entity.Role;
import com.ultron.backend.domain.entity.User;
import com.ultron.backend.repository.ProfileRepository;
import com.ultron.backend.repository.RoleRepository;
import com.ultron.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Core service for permission checking and authorization.
 * Results are cached in Redis for performance.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ProfileRepository profileRepository;

    /**
     * Check if user has permission on an object.
     * Cached for performance (10 minutes TTL).
     *
     * @param userId User ID
     * @param objectName Object name (USER, LEAD, ACCOUNT, etc.)
     * @param action Action (CREATE, READ, EDIT, DELETE)
     * @return true if user has permission
     */
    @Cacheable(value = "permissions", key = "#userId + '-' + #objectName + '-' + #action")
    public boolean hasPermission(String userId, String objectName, String action) {
        log.debug("Checking permission: userId={}, objectName={}, action={}", userId, objectName, action);

        // userId here is the MongoDB ObjectId from JWT authentication
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || !user.getStatus().toString().equals("ACTIVE") || user.getIsDeleted()) {
            log.debug("User not found, inactive, or deleted: userId={}", userId);
            return false;
        }

        // Get user's profile
        Profile profile = profileRepository.findByProfileId(user.getProfileId()).orElse(null);
        if (profile == null || !profile.getIsActive() || profile.getIsDeleted()) {
            log.debug("Profile not found, inactive, or deleted");
            return false;
        }

        // Check object-level permission in profile
        if (profile.getObjectPermissions() != null) {
            for (Profile.ObjectPermission op : profile.getObjectPermissions()) {
                if (op.getObjectName().equalsIgnoreCase(objectName)) {
                    boolean hasPermission = checkObjectPermission(op, action);
                    log.debug("Permission check result: {}", hasPermission);
                    return hasPermission;
                }
            }
        }

        log.debug("No permission found for object: {}", objectName);
        return false;
    }

    /**
     * Check if user can view a specific record based on role hierarchy and ownership.
     *
     * @param userId User ID
     * @param recordOwnerId Owner ID of the record
     * @param objectName Object name
     * @return true if user can view record
     */
    @Cacheable(value = "recordAccess", key = "#userId + '-' + #recordOwnerId + '-' + #objectName")
    public boolean canViewRecord(String userId, String recordOwnerId, String objectName) {
        log.debug("Checking record access: userId={}, recordOwnerId={}, objectName={}", userId, recordOwnerId, objectName);

        // If user is the owner, always allow
        if (userId.equals(recordOwnerId)) {
            return true;
        }

        // userId here is MongoDB ObjectId from JWT authentication
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return false;

        // Check if user has "View All" permission on this object
        Profile profile = profileRepository.findByProfileId(user.getProfileId()).orElse(null);
        if (profile != null && profile.getObjectPermissions() != null) {
            for (Profile.ObjectPermission op : profile.getObjectPermissions()) {
                if (op.getObjectName().equalsIgnoreCase(objectName) && op.getCanViewAll()) {
                    log.debug("User has canViewAll permission");
                    return true;
                }
            }
        }

        // Check role-based data visibility
        Role role = roleRepository.findByRoleId(user.getRoleId()).orElse(null);
        if (role == null) return false;

        String dataVisibility = role.getPermissions() != null ? role.getPermissions().getDataVisibility() : "OWN";

        switch (dataVisibility) {
            case "ALL":
                // Can view all records
                return true;

            case "ALL_USERS":
                // Can view all users' records
                return true;

            case "SUBORDINATES":
                // Can view own records + subordinates' records
                return isSubordinate(userId, recordOwnerId);

            case "OWN":
            default:
                // Can only view own records
                return userId.equals(recordOwnerId);
        }
    }

    /**
     * Check if targetUserId is a subordinate of managerId (recursive).
     *
     * @param managerId Manager user ID
     * @param targetUserId Target user ID
     * @return true if target is subordinate of manager
     */
    @Cacheable(value = "subordinates", key = "#managerId + '-' + #targetUserId")
    public boolean isSubordinate(String managerId, String targetUserId) {
        if (managerId.equals(targetUserId)) {
            return false;  // User is not their own subordinate
        }

        Set<String> visited = new HashSet<>();
        return isSubordinateRecursive(managerId, targetUserId, visited);
    }

    /**
     * Get all subordinates of a manager (recursive).
     *
     * @param managerId Manager user ID
     * @return List of subordinate user IDs
     */
    @Cacheable(value = "allSubordinates", key = "#managerId")
    public List<String> getAllSubordinates(String managerId) {
        List<String> subordinates = new ArrayList<>();
        Set<String> visited = new HashSet<>();
        collectSubordinates(managerId, subordinates, visited);
        return subordinates;
    }

    /**
     * Check if user has system permission (from role).
     *
     * @param userId User ID
     * @param permission Permission name (canManageUsers, canManageRoles, etc.)
     * @return true if user has permission
     */
    @Cacheable(value = "systemPermissions", key = "#userId + '-' + #permission")
    public boolean hasSystemPermission(String userId, String permission) {
        // userId here is MongoDB ObjectId from JWT authentication
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return false;

        Role role = roleRepository.findByRoleId(user.getRoleId()).orElse(null);
        if (role == null || role.getPermissions() == null) return false;

        Role.RolePermissions rolePerms = role.getPermissions();

        switch (permission.toLowerCase()) {
            case "canmanageusers":
                return rolePerms.getCanManageUsers();
            case "canmanageroles":
                return rolePerms.getCanManageRoles();
            case "canmanageprofiles":
                return rolePerms.getCanManageProfiles();
            case "canviewsetup":
                return rolePerms.getCanViewSetup();
            case "canmanagesharing":
                return rolePerms.getCanManageSharing();
            case "canviewalldata":
                return rolePerms.getCanViewAllData();
            case "canmodifyalldata":
                return rolePerms.getCanModifyAllData();
            case "canviewauditlog":
                return rolePerms.getCanViewAuditLog();
            case "canexportdata":
                return rolePerms.getCanExportData();
            case "canimportdata":
                return rolePerms.getCanImportData();
            default:
                return false;
        }
    }

    /**
     * Check if user can access a specific field on an object.
     *
     * @param userId User ID
     * @param objectName Object name
     * @param fieldName Field name
     * @param action Action (READ or EDIT)
     * @return true if user can access field
     */
    @Cacheable(value = "fieldPermissions", key = "#userId + '-' + #objectName + '-' + #fieldName + '-' + #action")
    public boolean hasFieldPermission(String userId, String objectName, String fieldName, String action) {
        // userId here is MongoDB ObjectId from JWT authentication
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return false;

        Profile profile = profileRepository.findByProfileId(user.getProfileId()).orElse(null);
        if (profile == null || profile.getFieldPermissions() == null) return true;  // Default: allow if no field permissions

        // Check field-level permission
        for (Profile.FieldPermission fp : profile.getFieldPermissions()) {
            if (fp.getObjectName().equalsIgnoreCase(objectName) && fp.getFieldName().equalsIgnoreCase(fieldName)) {
                if (fp.getIsHidden()) {
                    return false;  // Field is hidden for this profile
                }

                if ("READ".equalsIgnoreCase(action)) {
                    return fp.getCanRead();
                } else if ("EDIT".equalsIgnoreCase(action)) {
                    return fp.getCanEdit();
                }
            }
        }

        return true;  // Default: allow if no specific field permission found
    }

    // Helper methods

    private boolean checkObjectPermission(Profile.ObjectPermission op, String action) {
        switch (action.toUpperCase()) {
            case "CREATE":
                return op.getCanCreate();
            case "READ":
                return op.getCanRead();
            case "EDIT":
            case "UPDATE":
                return op.getCanEdit();
            case "DELETE":
                return op.getCanDelete();
            case "VIEWALL":
                return op.getCanViewAll();
            case "MODIFYALL":
                return op.getCanModifyAll();
            default:
                return false;
        }
    }

    private boolean isSubordinateRecursive(String managerId, String targetUserId, Set<String> visited) {
        if (visited.contains(targetUserId)) {
            return false;  // Prevent infinite loop
        }
        visited.add(targetUserId);

        // targetUserId here is MongoDB ObjectId
        User targetUser = userRepository.findById(targetUserId).orElse(null);
        if (targetUser == null || targetUser.getManagerId() == null) {
            return false;
        }

        // Direct subordinate
        if (targetUser.getManagerId().equals(managerId)) {
            return true;
        }

        // Recursive check up the hierarchy
        return isSubordinateRecursive(managerId, targetUser.getManagerId(), visited);
    }

    private void collectSubordinates(String managerId, List<String> subordinates, Set<String> visited) {
        if (visited.contains(managerId)) {
            return;  // Prevent infinite loop
        }
        visited.add(managerId);

        List<User> directSubordinates = userRepository.findByManagerIdAndIsDeletedFalse(managerId);
        for (User subordinate : directSubordinates) {
            subordinates.add(subordinate.getUserId());
            // Recursively collect their subordinates
            collectSubordinates(subordinate.getUserId(), subordinates, visited);
        }
    }
}
