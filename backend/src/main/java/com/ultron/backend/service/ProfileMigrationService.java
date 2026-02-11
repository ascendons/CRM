package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Profile;
import com.ultron.backend.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Service to migrate hardcoded profiles from PredefinedProfiles.java to MongoDB
 * and seed default profiles for new tenants
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileMigrationService {

    private final ProfileRepository profileRepository;
    private final ProfileIdGeneratorService profileIdGeneratorService;

    /**
     * Migrate predefined profiles from constants to database
     * Run once on application startup
     * Creates system profiles (templates) that can be cloned for each tenant
     */
    public void migratePredefinedProfilesToDatabase() {
        log.info("========================================");
        log.info("Starting Profile Migration to Database");
        log.info("========================================");

        // Check if system profiles already exist
        List<Profile> existingSystemProfiles = profileRepository.findByIsSystemProfileTrueAndIsDeletedFalse();
        if (!existingSystemProfiles.isEmpty()) {
            log.info("System profiles already exist in database. Skipping migration.");
            log.info("Found {} system profiles", existingSystemProfiles.size());
            return;
        }

        try {
            // Create 4 system profiles
            createSystemAdministratorProfile();
            createSalesManagerProfile();
            createSalesRepresentativeProfile();
            createReadOnlyUserProfile();

            log.info("========================================");
            log.info("Profile Migration Completed Successfully");
            log.info("Created 4 system profiles as templates");
            log.info("========================================");
        } catch (Exception e) {
            log.error("Profile migration failed: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to migrate profiles to database", e);
        }
    }

    /**
     * Seed default profiles for a new tenant
     * Called when a new organization is created
     */
    public void seedDefaultProfilesForTenant(String tenantId) {
        log.info("[Tenant: {}] Seeding default profiles", tenantId);

        // Check if profiles already exist for this tenant
        List<Profile> existingProfiles = profileRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        if (!existingProfiles.isEmpty()) {
            log.info("[Tenant: {}] Profiles already exist. Skipping seed.", tenantId);
            return;
        }

        // Get system profiles (templates)
        List<Profile> systemProfiles = profileRepository.findByIsSystemProfileTrueAndIsDeletedFalse();
        if (systemProfiles.isEmpty()) {
            log.error("[Tenant: {}] No system profiles found. Running migration first.", tenantId);
            migratePredefinedProfilesToDatabase();
            systemProfiles = profileRepository.findByIsSystemProfileTrueAndIsDeletedFalse();
        }

        // Clone each system profile for this tenant
        for (Profile systemProfile : systemProfiles) {
            Profile tenantProfile = Profile.builder()
                    .profileId(profileIdGeneratorService.generateProfileId())
                    .tenantId(tenantId)
                    .isSystemProfile(false)  // Not a system profile, tenant-specific
                    .profileName(systemProfile.getProfileName())
                    .description(systemProfile.getDescription())
                    .objectPermissions(systemProfile.getObjectPermissions() != null ?
                            new ArrayList<>(systemProfile.getObjectPermissions()) : null)
                    .fieldPermissions(systemProfile.getFieldPermissions() != null ?
                            new ArrayList<>(systemProfile.getFieldPermissions()) : null)
                    .systemPermissions(systemProfile.getSystemPermissions())
                    .isActive(true)
                    .isDeleted(false)
                    .createdAt(LocalDateTime.now())
                    .createdBy("SYSTEM")
                    .createdByName("System Migration")
                    .build();

            profileRepository.save(tenantProfile);
            log.info("[Tenant: {}] Created profile: {} ({})", tenantId, tenantProfile.getProfileName(), tenantProfile.getProfileId());
        }

        log.info("[Tenant: {}] Seeded {} default profiles", tenantId, systemProfiles.size());
    }

    // ===== SYSTEM PROFILE CREATION METHODS =====

    private void createSystemAdministratorProfile() {
        String profileId = "PROFILE-00001";  // Fixed ID for system admin

        Profile profile = Profile.builder()
                .profileId(profileId)
                .tenantId(null)  // System profile, not tenant-specific
                .isSystemProfile(true)
                .profileName("System Administrator")
                .description("Full access to all objects and fields")
                .objectPermissions(Arrays.asList(
                        createFullAccessPermission("USER"),
                        createFullAccessPermission("ROLE"),
                        createFullAccessPermission("PROFILE"),
                        createFullAccessPermission("LEAD"),
                        createFullAccessPermission("ACCOUNT"),
                        createFullAccessPermission("CONTACT"),
                        createFullAccessPermission("OPPORTUNITY"),
                        createFullAccessPermission("ACTIVITY"),
                        createFullAccessPermission("PRODUCT"),
                        createFullAccessPermission("PROPOSAL")
                ))
                .fieldPermissions(new ArrayList<>())  // No restrictions
                .systemPermissions(Profile.SystemPermissions.builder()
                        .canAccessAPI(true)
                        .apiRateLimit(10000)
                        .canAccessMobileApp(true)
                        .canAccessReports(true)
                        .canAccessDashboards(true)
                        .canBulkUpdate(true)
                        .canBulkDelete(true)
                        .canMassEmail(true)
                        .canBypassValidation(true)
                        .canRunApex(true)
                        .build())
                .isActive(true)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy("SYSTEM")
                .createdByName("System Migration")
                .build();

        profileRepository.save(profile);
        log.info("Created system profile: System Administrator ({})", profileId);
    }

    private void createSalesManagerProfile() {
        String profileId = "PROFILE-00002";  // Fixed ID for sales manager

        Profile profile = Profile.builder()
                .profileId(profileId)
                .tenantId(null)
                .isSystemProfile(true)
                .profileName("Sales Manager")
                .description("Manage sales objects with team visibility")
                .objectPermissions(Arrays.asList(
                        createReadOnlyPermission("USER"),
                        createReadOnlyPermission("ROLE"),
                        createReadOnlyPermission("PROFILE"),
                        createFullAccessPermission("LEAD"),
                        createFullAccessPermission("ACCOUNT"),
                        createFullAccessPermission("CONTACT"),
                        createFullAccessPermission("OPPORTUNITY"),
                        createFullAccessPermission("ACTIVITY"),
                        createFullAccessPermission("PRODUCT"),
                        createFullAccessPermission("PROPOSAL")
                ))
                .fieldPermissions(new ArrayList<>())
                .systemPermissions(Profile.SystemPermissions.builder()
                        .canAccessAPI(true)
                        .apiRateLimit(5000)
                        .canAccessMobileApp(true)
                        .canAccessReports(true)
                        .canAccessDashboards(true)
                        .canBulkUpdate(true)
                        .canBulkDelete(false)
                        .canMassEmail(true)
                        .canBypassValidation(false)
                        .canRunApex(false)
                        .build())
                .isActive(true)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy("SYSTEM")
                .createdByName("System Migration")
                .build();

        profileRepository.save(profile);
        log.info("Created system profile: Sales Manager ({})", profileId);
    }

    private void createSalesRepresentativeProfile() {
        String profileId = "PROFILE-00003";  // Fixed ID for sales rep

        Profile profile = Profile.builder()
                .profileId(profileId)
                .tenantId(null)
                .isSystemProfile(true)
                .profileName("Sales Representative")
                .description("Standard sales user access")
                .objectPermissions(Arrays.asList(
                        createReadOnlyPermission("USER"),
                        createNoAccessPermission("ROLE"),
                        createNoAccessPermission("PROFILE"),
                        createStandardPermission("LEAD"),
                        createStandardPermission("ACCOUNT"),
                        createStandardPermission("CONTACT"),
                        createStandardPermission("OPPORTUNITY"),
                        createStandardPermission("ACTIVITY"),
                        createStandardPermission("PRODUCT"),
                        createStandardPermission("PROPOSAL")
                ))
                .fieldPermissions(new ArrayList<>())
                .systemPermissions(Profile.SystemPermissions.builder()
                        .canAccessAPI(true)
                        .apiRateLimit(1000)
                        .canAccessMobileApp(true)
                        .canAccessReports(true)
                        .canAccessDashboards(true)
                        .canBulkUpdate(false)
                        .canBulkDelete(false)
                        .canMassEmail(false)
                        .canBypassValidation(false)
                        .canRunApex(false)
                        .build())
                .isActive(true)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy("SYSTEM")
                .createdByName("System Migration")
                .build();

        profileRepository.save(profile);
        log.info("Created system profile: Sales Representative ({})", profileId);
    }

    private void createReadOnlyUserProfile() {
        String profileId = "PROFILE-00004";  // Fixed ID for read-only

        Profile profile = Profile.builder()
                .profileId(profileId)
                .tenantId(null)
                .isSystemProfile(true)
                .profileName("Read Only User")
                .description("View-only access to all objects")
                .objectPermissions(Arrays.asList(
                        createReadOnlyPermission("USER"),
                        createReadOnlyPermission("ROLE"),
                        createReadOnlyPermission("PROFILE"),
                        createReadOnlyPermission("LEAD"),
                        createReadOnlyPermission("ACCOUNT"),
                        createReadOnlyPermission("CONTACT"),
                        createReadOnlyPermission("OPPORTUNITY"),
                        createReadOnlyPermission("ACTIVITY"),
                        createReadOnlyPermission("PRODUCT"),
                        createReadOnlyPermission("PROPOSAL")
                ))
                .fieldPermissions(new ArrayList<>())
                .systemPermissions(Profile.SystemPermissions.builder()
                        .canAccessAPI(true)
                        .apiRateLimit(500)
                        .canAccessMobileApp(true)
                        .canAccessReports(true)
                        .canAccessDashboards(true)
                        .canBulkUpdate(false)
                        .canBulkDelete(false)
                        .canMassEmail(false)
                        .canBypassValidation(false)
                        .canRunApex(false)
                        .build())
                .isActive(true)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy("SYSTEM")
                .createdByName("System Migration")
                .build();

        profileRepository.save(profile);
        log.info("Created system profile: Read Only User ({})", profileId);
    }

    // ===== HELPER METHODS =====

    private Profile.ObjectPermission createFullAccessPermission(String objectName) {
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

    private Profile.ObjectPermission createStandardPermission(String objectName) {
        return Profile.ObjectPermission.builder()
                .objectName(objectName)
                .canCreate(true)
                .canRead(true)
                .canEdit(true)
                .canDelete(true)
                .canViewAll(false)
                .canModifyAll(false)
                .build();
    }

    private Profile.ObjectPermission createReadOnlyPermission(String objectName) {
        return Profile.ObjectPermission.builder()
                .objectName(objectName)
                .canCreate(false)
                .canRead(true)
                .canEdit(false)
                .canDelete(false)
                .canViewAll(false)
                .canModifyAll(false)
                .build();
    }

    private Profile.ObjectPermission createNoAccessPermission(String objectName) {
        return Profile.ObjectPermission.builder()
                .objectName(objectName)
                .canCreate(false)
                .canRead(false)
                .canEdit(false)
                .canDelete(false)
                .canViewAll(false)
                .canModifyAll(false)
                .build();
    }
}
