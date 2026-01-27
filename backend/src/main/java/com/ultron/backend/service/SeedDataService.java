package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Profile;
import com.ultron.backend.domain.entity.Role;
import com.ultron.backend.repository.ProfileRepository;
import com.ultron.backend.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Service to create default/seed data on application startup.
 * Creates System Administrator role and profile if they don't exist.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SeedDataService implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final ProfileRepository profileRepository;

    public static final String DEFAULT_ADMIN_ROLE_ID = "ROLE-00001";
    public static final String DEFAULT_ADMIN_PROFILE_ID = "PROFILE-00001";
    public static final String SYSTEM_USER = "SYSTEM";

    @Override
    public void run(String... args) {
        log.info("Checking for seed data...");
        createDefaultAdminRoleIfNotExists();
        createDefaultAdminProfileIfNotExists();
        log.info("Seed data check complete");
    }

    /**
     * Create default System Administrator role if it doesn't exist.
     */
    private void createDefaultAdminRoleIfNotExists() {
        if (roleRepository.findByRoleId(DEFAULT_ADMIN_ROLE_ID).isPresent()) {
            log.debug("Default admin role already exists: {}", DEFAULT_ADMIN_ROLE_ID);
            return;
        }

        log.info("Creating default System Administrator role...");

        Role.RolePermissions permissions = Role.RolePermissions.builder()
                .dataVisibility("ALL")
                .canManageUsers(true)
                .canManageRoles(true)
                .canManageProfiles(true)
                .canViewSetup(true)
                .canManageSharing(true)
                .canViewAllData(true)
                .canModifyAllData(true)
                .canViewAuditLog(true)
                .canExportData(true)
                .canImportData(true)
                .build();

        Role adminRole = Role.builder()
                .roleId(DEFAULT_ADMIN_ROLE_ID)
                .roleName("System Administrator")
                .description("Full system access with all administrative privileges")
                .parentRoleId(null)
                .parentRoleName(null)
                .level(0)
                .childRoleIds(new ArrayList<>())
                .permissions(permissions)
                .isActive(true)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(SYSTEM_USER)
                .build();

        roleRepository.save(adminRole);
        log.info("Default admin role created: {}", DEFAULT_ADMIN_ROLE_ID);
    }

    /**
     * Create default System Administrator profile if it doesn't exist.
     */
    private void createDefaultAdminProfileIfNotExists() {
        if (profileRepository.findByProfileId(DEFAULT_ADMIN_PROFILE_ID).isPresent()) {
            log.debug("Default admin profile already exists: {}", DEFAULT_ADMIN_PROFILE_ID);
            return;
        }

        log.info("Creating default System Administrator profile...");

        // Object permissions - full access to all objects
        List<Profile.ObjectPermission> objectPermissions = List.of(
                createFullObjectPermission("USER"),
                createFullObjectPermission("ROLE"),
                createFullObjectPermission("PROFILE"),
                createFullObjectPermission("LEAD"),
                createFullObjectPermission("ACCOUNT"),
                createFullObjectPermission("CONTACT"),
                createFullObjectPermission("OPPORTUNITY"),
                createFullObjectPermission("ACTIVITY")
        );

        // System permissions - all enabled
        Profile.SystemPermissions systemPermissions = Profile.SystemPermissions.builder()
                .canAccessAPI(true)
                .apiRateLimit(10000) // Higher limit for admins
                .canAccessMobileApp(true)
                .canAccessReports(true)
                .canAccessDashboards(true)
                .canBulkUpdate(true)
                .canBulkDelete(true)
                .canMassEmail(true)
                .canBypassValidation(true)
                .canRunApex(true)
                .build();

        Profile adminProfile = Profile.builder()
                .profileId(DEFAULT_ADMIN_PROFILE_ID)
                .profileName("System Administrator")
                .description("Full system access with all permissions")
                .objectPermissions(objectPermissions)
                .fieldPermissions(new ArrayList<>()) // No field restrictions
                .systemPermissions(systemPermissions)
                .isActive(true)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(SYSTEM_USER)
                .build();

        profileRepository.save(adminProfile);
        log.info("Default admin profile created: {}", DEFAULT_ADMIN_PROFILE_ID);
    }

    private Profile.ObjectPermission createFullObjectPermission(String objectName) {
        return Profile.ObjectPermission.builder()
                .objectName(objectName)
                .canCreate(true)
                .canRead(true)
                .canEdit(true)
                .canDelete(true)
                .canViewAll(true)
                .canModifyAll(true)
                .build();
    }

    /**
     * Get default admin role ID for first user assignment.
     */
    public String getDefaultAdminRoleId() {
        return DEFAULT_ADMIN_ROLE_ID;
    }

    /**
     * Get default admin profile ID for first user assignment.
     */
    public String getDefaultAdminProfileId() {
        return DEFAULT_ADMIN_PROFILE_ID;
    }
}
