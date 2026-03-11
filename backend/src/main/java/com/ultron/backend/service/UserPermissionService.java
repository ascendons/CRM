package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Profile;
import com.ultron.backend.domain.entity.User;
import com.ultron.backend.dto.permission.*;
import com.ultron.backend.exception.BusinessException;
import com.ultron.backend.repository.ProfileRepository;
import com.ultron.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for managing user-specific permission overrides
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserPermissionService extends BaseTenantService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final AuditLogService auditLogService;

    // Permission metadata - maps object names to display names and available actions
    private static final Map<String, ObjectMetadata> PERMISSION_METADATA = initializeMetadata();

    /**
     * Get user's effective permissions (profile + overrides)
     */
    public EffectivePermissionsResponse getEffectivePermissions(String userId) {
        String tenantId = getCurrentTenantId();
        log.info("Fetching effective permissions for user: {} in tenant: {}", userId, tenantId);

        User user = userRepository.findByUserIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new BusinessException("User not found: " + userId));

        Profile profile = profileRepository.findByProfileIdAndTenantId(user.getProfileId(), tenantId)
                .orElseThrow(() -> new BusinessException("Profile not found: " + user.getProfileId()));

        // Build module-organized permissions
        List<EffectivePermissionsResponse.ModulePermissions> modules = buildModulePermissions(profile, user);

        // Get user overrides
        List<PermissionOverrideDto> overrides = user.getPermissionOverrides() != null ?
                user.getPermissionOverrides().stream()
                        .map(this::mapToDto)
                        .collect(Collectors.toList()) :
                Collections.emptyList();

        return EffectivePermissionsResponse.builder()
                .userId(user.getUserId())
                .userName(user.getFullName())
                .userEmail(user.getEmail())
                .profileId(profile.getProfileId())
                .profileName(profile.getProfileName())
                .modules(modules)
                .overrides(overrides)
                .build();
    }

    /**
     * Grant permission to a user
     */
    @Transactional
    public void grantPermission(String userId, GrantPermissionRequest request, String grantedByUserId) {
        String tenantId = getCurrentTenantId();
        log.info("Granting permission {} on {} to user: {}", request.getAction(), request.getObjectName(), userId);

        User user = userRepository.findByUserIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new BusinessException("User not found: " + userId));

        // grantedByUserId comes from JWT 'sub' which is MongoDB _id
        User grantedByUser = userRepository.findById(grantedByUserId)
                .orElseThrow(() -> new BusinessException("Granting user not found"));

        // Validate permission exists
        validatePermission(request.getObjectName(), request.getAction());

        // Remove existing override for this permission if any
        if (user.getPermissionOverrides() == null) {
            user.setPermissionOverrides(new ArrayList<>());
        } else {
            user.getPermissionOverrides().removeIf(po ->
                    po.getObjectName().equals(request.getObjectName()) &&
                            po.getAction().equalsIgnoreCase(request.getAction())
            );
        }

        // Add new override
        User.PermissionOverride override = User.PermissionOverride.builder()
                .objectName(request.getObjectName().toUpperCase())
                .action(request.getAction().toUpperCase())
                .granted(true)
                .grantedBy(grantedByUserId)
                .grantedByName(grantedByUser.getFullName())
                .grantedAt(LocalDateTime.now())
                .reason(request.getReason())
                .expiresAt(request.getExpiresAt())
                .build();

        user.getPermissionOverrides().add(override);
        user.setLastModifiedAt(LocalDateTime.now());
        user.setLastModifiedBy(grantedByUserId);
        user.setLastModifiedByName(grantedByUser.getFullName());

        userRepository.save(user);

        // Audit log
        auditLogService.logAsync(
                "USER",
                userId,
                user.getFullName(),
                "PERMISSION_GRANTED",
                String.format("Granted %s on %s. Reason: %s",
                        request.getAction(), request.getObjectName(),
                        request.getReason() != null ? request.getReason() : "N/A"),
                null,
                String.format("%s:%s=true", request.getObjectName(), request.getAction()),
                grantedByUserId,
                null
        );

        log.info("Successfully granted permission {} on {} to user: {}", request.getAction(), request.getObjectName(), userId);
    }

    /**
     * Revoke user-specific permission (revert to profile default)
     */
    @Transactional
    public void revokePermission(String userId, RevokePermissionRequest request, String revokedByUserId) {
        String tenantId = getCurrentTenantId();
        log.info("Revoking permission {} on {} from user: {}", request.getAction(), request.getObjectName(), userId);

        User user = userRepository.findByUserIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new BusinessException("User not found: " + userId));

        // revokedByUserId comes from JWT 'sub' which is MongoDB _id
        User revokedByUser = userRepository.findById(revokedByUserId)
                .orElseThrow(() -> new BusinessException("Revoking user not found"));

        if (user.getPermissionOverrides() == null || user.getPermissionOverrides().isEmpty()) {
            throw new BusinessException("No permission overrides found for this user");
        }

        // Remove the override
        boolean removed = user.getPermissionOverrides().removeIf(po ->
                po.getObjectName().equalsIgnoreCase(request.getObjectName()) &&
                        po.getAction().equalsIgnoreCase(request.getAction())
        );

        if (!removed) {
            throw new BusinessException(String.format("Permission override not found: %s on %s",
                    request.getAction(), request.getObjectName()));
        }

        user.setLastModifiedAt(LocalDateTime.now());
        user.setLastModifiedBy(revokedByUserId);
        user.setLastModifiedByName(revokedByUser.getFullName());

        userRepository.save(user);

        // Audit log
        auditLogService.logAsync(
                "USER",
                userId,
                user.getFullName(),
                "PERMISSION_REVOKED",
                String.format("Revoked %s on %s. Reason: %s",
                        request.getAction(), request.getObjectName(),
                        request.getReason() != null ? request.getReason() : "N/A"),
                String.format("%s:%s=true", request.getObjectName(), request.getAction()),
                null,
                revokedByUserId,
                null
        );

        log.info("Successfully revoked permission {} on {} from user: {}", request.getAction(), request.getObjectName(), userId);
    }

    /**
     * Bulk update permissions
     */
    @Transactional
    public void bulkUpdatePermissions(String userId, BulkUpdatePermissionsRequest request, String updatedByUserId) {
        log.info("Bulk updating permissions for user: {}", userId);

        // Grant permissions
        if (request.getGrants() != null && !request.getGrants().isEmpty()) {
            for (GrantPermissionRequest grant : request.getGrants()) {
                if (request.getReason() != null && grant.getReason() == null) {
                    grant.setReason(request.getReason());
                }
                grantPermission(userId, grant, updatedByUserId);
            }
        }

        // Revoke permissions
        if (request.getRevokes() != null && !request.getRevokes().isEmpty()) {
            for (RevokePermissionRequest revoke : request.getRevokes()) {
                if (request.getReason() != null && revoke.getReason() == null) {
                    revoke.setReason(request.getReason());
                }
                revokePermission(userId, revoke, updatedByUserId);
            }
        }

        log.info("Successfully bulk updated permissions for user: {}", userId);
    }

    /**
     * Get user's permission overrides only
     */
    public List<PermissionOverrideDto> getUserOverrides(String userId) {
        String tenantId = getCurrentTenantId();

        User user = userRepository.findByUserIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new BusinessException("User not found: " + userId));

        if (user.getPermissionOverrides() == null) {
            return Collections.emptyList();
        }

        return user.getPermissionOverrides().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    // ========== Private Helper Methods ==========

    private List<EffectivePermissionsResponse.ModulePermissions> buildModulePermissions(Profile profile, User user) {
        List<EffectivePermissionsResponse.ModulePermissions> modules = new ArrayList<>();

        // Group permissions by module
        Map<String, List<String>> moduleToObjects = PERMISSION_METADATA.entrySet().stream()
                .collect(Collectors.groupingBy(
                        e -> e.getValue().module,
                        Collectors.mapping(Map.Entry::getKey, Collectors.toList())
                ));

        // Build each module
        for (Map.Entry<String, List<String>> entry : moduleToObjects.entrySet()) {
            String moduleName = entry.getKey();
            List<String> objectNames = entry.getValue();

            List<EffectivePermissionsResponse.ObjectPermissions> objects = new ArrayList<>();

            for (String objectName : objectNames) {
                ObjectMetadata metadata = PERMISSION_METADATA.get(objectName);
                Map<String, EffectivePermissionsResponse.PermissionDetail> permissions = new HashMap<>();

                for (String action : metadata.availableActions) {
                    EffectivePermissionsResponse.PermissionDetail detail = getPermissionDetail(
                            objectName, action, profile, user
                    );
                    permissions.put(action, detail);
                }

                objects.add(EffectivePermissionsResponse.ObjectPermissions.builder()
                        .objectName(objectName)
                        .displayName(metadata.displayName)
                        .permissions(permissions)
                        .build());
            }

            modules.add(EffectivePermissionsResponse.ModulePermissions.builder()
                    .moduleName(moduleName)
                    .displayName(getModuleDisplayName(moduleName))
                    .objects(objects)
                    .build());
        }

        return modules;
    }

    private EffectivePermissionsResponse.PermissionDetail getPermissionDetail(
            String objectName, String action, Profile profile, User user) {

        // Check user override first
        if (user.getPermissionOverrides() != null) {
            Optional<User.PermissionOverride> override = user.getPermissionOverrides().stream()
                    .filter(po -> po.getObjectName().equalsIgnoreCase(objectName) &&
                            po.getAction().equalsIgnoreCase(action))
                    .findFirst();

            if (override.isPresent()) {
                User.PermissionOverride po = override.get();
                return EffectivePermissionsResponse.PermissionDetail.builder()
                        .action(action)
                        .granted(po.getGranted())
                        .source(po.getGranted() ? "USER_GRANT" : "USER_DENY")
                        .isOverride(true)
                        .build();
            }
        }

        // Check profile permission
        boolean granted = checkProfilePermission(profile, objectName, action);

        return EffectivePermissionsResponse.PermissionDetail.builder()
                .action(action)
                .granted(granted)
                .source("PROFILE")
                .isOverride(false)
                .build();
    }

    private boolean checkProfilePermission(Profile profile, String objectName, String action) {
        if (profile.getObjectPermissions() == null) {
            return false;
        }

        return profile.getObjectPermissions().stream()
                .filter(op -> op.getObjectName().equalsIgnoreCase(objectName))
                .findFirst()
                .map(op -> checkObjectPermission(op, action))
                .orElse(false);
    }

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
            case "READ_ALL":
                return op.getCanViewAll();
            case "MODIFYALL":
                return op.getCanModifyAll();
            case "APPROVE":
            case "SEND":
            case "REJECT":
            case "CANCEL":
            case "ASSIGN":
                return op.getCanEdit(); // Workflow actions require edit permission
            default:
                return false;
        }
    }

    private void validatePermission(String objectName, String action) {
        ObjectMetadata metadata = PERMISSION_METADATA.get(objectName.toUpperCase());
        if (metadata == null) {
            throw new BusinessException("Unknown object: " + objectName);
        }

        if (!metadata.availableActions.contains(action.toUpperCase())) {
            throw new BusinessException(String.format("Invalid action '%s' for object '%s'", action, objectName));
        }
    }

    private PermissionOverrideDto mapToDto(User.PermissionOverride override) {
        return PermissionOverrideDto.builder()
                .objectName(override.getObjectName())
                .action(override.getAction())
                .granted(override.getGranted())
                .grantedBy(override.getGrantedBy())
                .grantedByName(override.getGrantedByName())
                .grantedAt(override.getGrantedAt())
                .reason(override.getReason())
                .expiresAt(override.getExpiresAt())
                .build();
    }

    private String getModuleDisplayName(String moduleName) {
        switch (moduleName) {
            case "ADMINISTRATION": return "Administration";
            case "CRM": return "Sales & CRM";
            case "HR": return "Human Resources";
            case "SETTINGS": return "Settings";
            default: return moduleName;
        }
    }

    // ========== Permission Metadata ==========

    private static Map<String, ObjectMetadata> initializeMetadata() {
        Map<String, ObjectMetadata> metadata = new LinkedHashMap<>();

        // ADMINISTRATION
        metadata.put("USER", new ObjectMetadata("ADMINISTRATION", "Users",
                Arrays.asList("CREATE", "READ", "EDIT", "DELETE", "VIEWALL", "MODIFYALL")));
        metadata.put("ROLE", new ObjectMetadata("ADMINISTRATION", "Roles",
                Arrays.asList("CREATE", "READ", "EDIT", "DELETE")));
        metadata.put("PROFILE", new ObjectMetadata("ADMINISTRATION", "Profiles",
                Arrays.asList("CREATE", "READ", "EDIT", "DELETE")));

        // CRM
        metadata.put("LEAD", new ObjectMetadata("CRM", "Leads",
                Arrays.asList("CREATE", "READ", "EDIT", "DELETE")));
        metadata.put("OPPORTUNITY", new ObjectMetadata("CRM", "Opportunities",
                Arrays.asList("CREATE", "READ", "EDIT")));
        metadata.put("CONTACT", new ObjectMetadata("CRM", "Contacts",
                Arrays.asList("CREATE", "READ", "EDIT", "DELETE")));
        metadata.put("ACCOUNT", new ObjectMetadata("CRM", "Accounts",
                Arrays.asList("CREATE", "READ", "EDIT", "DELETE")));
        metadata.put("ACTIVITY", new ObjectMetadata("CRM", "Activities",
                Arrays.asList("CREATE", "READ", "EDIT", "DELETE")));
        metadata.put("PROPOSAL", new ObjectMetadata("CRM", "Proposals",
                Arrays.asList("CREATE", "READ", "EDIT", "DELETE", "SEND", "APPROVE", "REJECT", "UPDATE")));
        metadata.put("PRODUCT", new ObjectMetadata("CRM", "Products",
                Arrays.asList("CREATE", "READ", "EDIT", "DELETE")));

        // HR
        metadata.put("ATTENDANCE", new ObjectMetadata("HR", "Attendance",
                Arrays.asList("CREATE", "READ", "EDIT", "READ_ALL", "APPROVE")));
        metadata.put("SHIFT", new ObjectMetadata("HR", "Shifts",
                Arrays.asList("CREATE", "READ", "EDIT", "DELETE", "ASSIGN")));
        metadata.put("LEAVE", new ObjectMetadata("HR", "Leave Management",
                Arrays.asList("CREATE", "READ", "READ_ALL", "APPROVE", "CANCEL")));
        metadata.put("HOLIDAY", new ObjectMetadata("HR", "Holidays",
                Arrays.asList("CREATE", "READ", "EDIT", "DELETE")));

        // SETTINGS
        metadata.put("LOCATION", new ObjectMetadata("SETTINGS", "Office Locations",
                Arrays.asList("CREATE", "READ", "EDIT", "DELETE")));

        return metadata;
    }

    private static class ObjectMetadata {
        String module;
        String displayName;
        List<String> availableActions;

        ObjectMetadata(String module, String displayName, List<String> availableActions) {
            this.module = module;
            this.displayName = displayName;
            this.availableActions = availableActions;
        }
    }
}
