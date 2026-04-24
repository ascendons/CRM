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
            // Create system profiles
            createSystemAdministratorProfile();
            createSalesManagerProfile();
            createSalesRepresentativeProfile();
            createReadOnlyUserProfile();
            // Field Service profiles
            createFieldEngineerProfile();
            createDispatchManagerProfile();
            createWarehouseManagerProfile();
            createServiceManagerProfile();

            log.info("========================================");
            log.info("Profile Migration Completed Successfully");
            log.info("Created 8 system profiles as templates");
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
                        // Administration
                        createFullAccessPermission("USER"),
                        createFullAccessPermission("ROLE"),
                        createFullAccessPermission("PROFILE"),
                        // CRM
                        createFullAccessPermission("LEAD"),
                        createFullAccessPermission("ACCOUNT"),
                        createFullAccessPermission("CONTACT"),
                        createFullAccessPermission("OPPORTUNITY"),
                        createFullAccessPermission("ACTIVITY"),
                        createFullAccessPermission("PRODUCT"),
                        createFullAccessPermission("PROPOSAL"),
                        // HR
                        createFullAccessPermission("ATTENDANCE"),
                        createFullAccessPermission("SHIFT"),
                        createFullAccessPermission("LEAVE"),
                        createFullAccessPermission("HOLIDAY"),
                        // Settings
                        createFullAccessPermission("LOCATION"),
                        // Field Service
                        createFullAccessPermission("ASSETS"),
                        createFullAccessPermission("CONTRACTS"),
                        createFullAccessPermission("SERVICE_REQUESTS"),
                        createFullAccessPermission("WORK_ORDERS")
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
                        // Administration (Read Only)
                        createReadOnlyPermission("USER"),
                        createReadOnlyPermission("ROLE"),
                        createReadOnlyPermission("PROFILE"),
                        // CRM (Full Access)
                        createFullAccessPermission("LEAD"),
                        createFullAccessPermission("ACCOUNT"),
                        createFullAccessPermission("CONTACT"),
                        createFullAccessPermission("OPPORTUNITY"),
                        createFullAccessPermission("ACTIVITY"),
                        createFullAccessPermission("PRODUCT"),
                        createFullAccessPermission("PROPOSAL"),
                        // HR (Standard Access - no VIEWALL for attendance)
                        createStandardPermission("ATTENDANCE"),  // Can manage own, not view all
                        createFullAccessPermission("SHIFT"),
                        createFullAccessPermission("LEAVE"),
                        createFullAccessPermission("HOLIDAY"),
                        // Settings (Read Only)
                        createReadOnlyPermission("LOCATION"),
                        // Field Service (Full Access)
                        createFullAccessPermission("ASSETS"),
                        createFullAccessPermission("CONTRACTS"),
                        createFullAccessPermission("SERVICE_REQUESTS"),
                        createFullAccessPermission("WORK_ORDERS")
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
                        // Administration
                        createReadOnlyPermission("USER"),
                        createNoAccessPermission("ROLE"),
                        createNoAccessPermission("PROFILE"),
                        // CRM
                        createStandardPermission("LEAD"),
                        createStandardPermission("ACCOUNT"),
                        createStandardPermission("CONTACT"),
                        createStandardPermission("OPPORTUNITY"),
                        createStandardPermission("ACTIVITY"),
                        createStandardPermission("PRODUCT"),
                        createStandardPermission("PROPOSAL"),
                        // HR
                        createStandardPermission("ATTENDANCE"),
                        createReadOnlyPermission("SHIFT"),
                        createStandardPermission("LEAVE"),
                        createReadOnlyPermission("HOLIDAY"),
                        // Settings
                        createReadOnlyPermission("LOCATION"),
                        // Field Service (Standard Access)
                        createStandardPermission("ASSETS"),
                        createStandardPermission("CONTRACTS"),
                        createStandardPermission("SERVICE_REQUESTS"),
                        createStandardPermission("WORK_ORDERS")
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
                        // Administration
                        createReadOnlyPermission("USER"),
                        createReadOnlyPermission("ROLE"),
                        createReadOnlyPermission("PROFILE"),
                        // CRM
                        createReadOnlyPermission("LEAD"),
                        createReadOnlyPermission("ACCOUNT"),
                        createReadOnlyPermission("CONTACT"),
                        createReadOnlyPermission("OPPORTUNITY"),
                        createReadOnlyPermission("ACTIVITY"),
                        createReadOnlyPermission("PRODUCT"),
                        createReadOnlyPermission("PROPOSAL"),
                        // HR
                        createReadOnlyPermission("ATTENDANCE"),
                        createReadOnlyPermission("SHIFT"),
                        createReadOnlyPermission("LEAVE"),
                        createReadOnlyPermission("HOLIDAY"),
                        // Settings
                        createReadOnlyPermission("LOCATION"),
                        // Field Service (Read Only)
                        createReadOnlyPermission("ASSETS"),
                        createReadOnlyPermission("CONTRACTS"),
                        createReadOnlyPermission("SERVICE_REQUESTS"),
                        createReadOnlyPermission("WORK_ORDERS")
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

    private void createFieldEngineerProfile() {
        String profileId = "PROFILE-00005";
        Profile profile = Profile.builder()
                .profileId(profileId).tenantId(null).isSystemProfile(true)
                .profileName("Field Engineer")
                .description("Mobile field technician: WO execution, checklist, parts request")
                .objectPermissions(Arrays.asList(
                        createReadOnlyPermission("USER"),
                        createNoAccessPermission("ROLE"),
                        createNoAccessPermission("PROFILE"),
                        createReadOnlyPermission("ACCOUNT"),
                        createReadOnlyPermission("CONTACT"),
                        createReadOnlyPermission("ASSETS"),
                        createReadOnlyPermission("CONTRACTS"),
                        createStandardPermission("SERVICE_REQUESTS"),
                        createStandardPermission("WORK_ORDERS"),
                        createStandardPermission("DISPATCH"),
                        createStandardPermission("SKILL_MATRIX"),
                        createStandardPermission("PARTS_REQUEST"),
                        createReadOnlyPermission("VENDORS"),
                        createReadOnlyPermission("PROCUREMENT"),
                        createNoAccessPermission("DEALERS"),
                        createReadOnlyPermission("SERVICE_ANALYTICS"),
                        createNoAccessPermission("ESCALATION"),
                        createNoAccessPermission("PURCHASE_ORDER")
                ))
                .fieldPermissions(new ArrayList<>())
                .systemPermissions(Profile.SystemPermissions.builder()
                        .canAccessAPI(true).apiRateLimit(500).canAccessMobileApp(true)
                        .canAccessReports(false).canAccessDashboards(false)
                        .canBulkUpdate(false).canBulkDelete(false).canMassEmail(false)
                        .canBypassValidation(false).canRunApex(false).build())
                .isActive(true).isDeleted(false)
                .createdAt(LocalDateTime.now()).createdBy("SYSTEM").createdByName("System Migration")
                .build();
        profileRepository.save(profile);
        log.info("Created system profile: Field Engineer ({})", profileId);
    }

    private void createDispatchManagerProfile() {
        String profileId = "PROFILE-00006";
        Profile profile = Profile.builder()
                .profileId(profileId).tenantId(null).isSystemProfile(true)
                .profileName("Dispatch Manager")
                .description("Assign and dispatch engineers, manage schedules")
                .objectPermissions(Arrays.asList(
                        createReadOnlyPermission("USER"),
                        createNoAccessPermission("ROLE"),
                        createNoAccessPermission("PROFILE"),
                        createReadOnlyPermission("ACCOUNT"),
                        createReadOnlyPermission("CONTACT"),
                        createFullAccessPermission("ASSETS"),
                        createFullAccessPermission("CONTRACTS"),
                        createFullAccessPermission("SERVICE_REQUESTS"),
                        createFullAccessPermission("WORK_ORDERS"),
                        createFullAccessPermission("DISPATCH"),
                        createReadOnlyPermission("SKILL_MATRIX"),
                        createReadOnlyPermission("PARTS_REQUEST"),
                        createReadOnlyPermission("VENDORS"),
                        createReadOnlyPermission("PROCUREMENT"),
                        createNoAccessPermission("DEALERS"),
                        createReadOnlyPermission("SERVICE_ANALYTICS"),
                        createReadOnlyPermission("ESCALATION"),
                        createNoAccessPermission("PURCHASE_ORDER")
                ))
                .fieldPermissions(new ArrayList<>())
                .systemPermissions(Profile.SystemPermissions.builder()
                        .canAccessAPI(true).apiRateLimit(2000).canAccessMobileApp(true)
                        .canAccessReports(true).canAccessDashboards(true)
                        .canBulkUpdate(true).canBulkDelete(false).canMassEmail(false)
                        .canBypassValidation(false).canRunApex(false).build())
                .isActive(true).isDeleted(false)
                .createdAt(LocalDateTime.now()).createdBy("SYSTEM").createdByName("System Migration")
                .build();
        profileRepository.save(profile);
        log.info("Created system profile: Dispatch Manager ({})", profileId);
    }

    private void createWarehouseManagerProfile() {
        String profileId = "PROFILE-00007";
        Profile profile = Profile.builder()
                .profileId(profileId).tenantId(null).isSystemProfile(true)
                .profileName("Warehouse Manager")
                .description("Manage stock, approve parts requests, create GRNs")
                .objectPermissions(Arrays.asList(
                        createReadOnlyPermission("USER"),
                        createNoAccessPermission("ROLE"),
                        createNoAccessPermission("PROFILE"),
                        createReadOnlyPermission("ACCOUNT"),
                        createNoAccessPermission("CONTACT"),
                        createReadOnlyPermission("ASSETS"),
                        createReadOnlyPermission("CONTRACTS"),
                        createReadOnlyPermission("SERVICE_REQUESTS"),
                        createReadOnlyPermission("WORK_ORDERS"),
                        createNoAccessPermission("DISPATCH"),
                        createReadOnlyPermission("SKILL_MATRIX"),
                        createFullAccessPermission("PARTS_REQUEST"),
                        createFullAccessPermission("VENDORS"),
                        createFullAccessPermission("PROCUREMENT"),
                        createNoAccessPermission("DEALERS"),
                        createReadOnlyPermission("SERVICE_ANALYTICS"),
                        createNoAccessPermission("ESCALATION"),
                        createStandardPermission("PURCHASE_ORDER")
                ))
                .fieldPermissions(new ArrayList<>())
                .systemPermissions(Profile.SystemPermissions.builder()
                        .canAccessAPI(true).apiRateLimit(2000).canAccessMobileApp(true)
                        .canAccessReports(true).canAccessDashboards(true)
                        .canBulkUpdate(true).canBulkDelete(false).canMassEmail(false)
                        .canBypassValidation(false).canRunApex(false).build())
                .isActive(true).isDeleted(false)
                .createdAt(LocalDateTime.now()).createdBy("SYSTEM").createdByName("System Migration")
                .build();
        profileRepository.save(profile);
        log.info("Created system profile: Warehouse Manager ({})", profileId);
    }

    private void createServiceManagerProfile() {
        String profileId = "PROFILE-00008";
        Profile profile = Profile.builder()
                .profileId(profileId).tenantId(null).isSystemProfile(true)
                .profileName("Service Manager")
                .description("Full field service operations, SLA monitoring, analytics")
                .objectPermissions(Arrays.asList(
                        createReadOnlyPermission("USER"),
                        createNoAccessPermission("ROLE"),
                        createNoAccessPermission("PROFILE"),
                        createReadOnlyPermission("ACCOUNT"),
                        createReadOnlyPermission("CONTACT"),
                        createFullAccessPermission("ASSETS"),
                        createFullAccessPermission("CONTRACTS"),
                        createFullAccessPermission("SERVICE_REQUESTS"),
                        createFullAccessPermission("WORK_ORDERS"),
                        createFullAccessPermission("DISPATCH"),
                        createFullAccessPermission("SKILL_MATRIX"),
                        createFullAccessPermission("PARTS_REQUEST"),
                        createFullAccessPermission("VENDORS"),
                        createFullAccessPermission("PROCUREMENT"),
                        createReadOnlyPermission("DEALERS"),
                        createFullAccessPermission("SERVICE_ANALYTICS"),
                        createFullAccessPermission("ESCALATION"),
                        createStandardPermission("PURCHASE_ORDER")
                ))
                .fieldPermissions(new ArrayList<>())
                .systemPermissions(Profile.SystemPermissions.builder()
                        .canAccessAPI(true).apiRateLimit(5000).canAccessMobileApp(true)
                        .canAccessReports(true).canAccessDashboards(true)
                        .canBulkUpdate(true).canBulkDelete(false).canMassEmail(true)
                        .canBypassValidation(false).canRunApex(false).build())
                .isActive(true).isDeleted(false)
                .createdAt(LocalDateTime.now()).createdBy("SYSTEM").createdByName("System Migration")
                .build();
        profileRepository.save(profile);
        log.info("Created system profile: Service Manager ({})", profileId);
    }

    /**
     * Patch existing profiles in the database with missing Field Service permissions
     */
    public void patchMissingPermissions() {
        log.info("Starting Patch: Missing Field Service Permissions");
        List<Profile> allProfiles = profileRepository.findByIsDeletedFalse();
        int patchCount = 0;

        List<String> fieldServiceObjects = Arrays.asList(
                "ASSETS", "CONTRACTS", "SERVICE_REQUESTS", "WORK_ORDERS",
                "DISPATCH", "SKILL_MATRIX", "PARTS_REQUEST",
                "VENDORS", "PROCUREMENT", "DEALERS",
                "SERVICE_ANALYTICS", "ESCALATION", "PURCHASE_ORDER",
                "PROJECTS", "KNOWLEDGE_BASE", "WEB_FORMS",
                "PERFORMANCE_REVIEWS", "OKR", "ONBOARDING", "FEED",
                "CURRENCY", "ESIGNATURE", "REPORTS", "SURVEYS", "PORTAL"
        );

        for (Profile profile : allProfiles) {
            boolean modified = false;
            List<Profile.ObjectPermission> permissions = profile.getObjectPermissions();
            if (permissions == null) {
                permissions = new ArrayList<>();
                profile.setObjectPermissions(permissions);
            }

            for (String objName : fieldServiceObjects) {
                boolean exists = permissions.stream()
                        .anyMatch(p -> p.getObjectName().equalsIgnoreCase(objName));
                
                if (!exists) {
                    // Admins and Managers get Full Access, others get Standard or Read Only based on name
                    Profile.ObjectPermission newPerm;
                    if (profile.getProfileName().contains("Administrator") || profile.getProfileName().contains("Manager")) {
                        newPerm = createFullAccessPermission(objName);
                    } else if (profile.getProfileName().contains("Read Only")) {
                        newPerm = createReadOnlyPermission(objName);
                    } else {
                        newPerm = createStandardPermission(objName);
                    }
                    permissions.add(newPerm);
                    modified = true;
                }
            }

            if (modified) {
                profileRepository.save(profile);
                patchCount++;
                log.info("Patched permissions for profile: {}", profile.getProfileName());
            }
        }
        log.info("Completed Patch: Updated {} profiles", patchCount);

        // Ensure LEAVE permissions are correct for all profiles
        patchLeavePermissions();
    }

    /**
     * Ensure all active profiles have correct LEAVE permissions.
     * Fixes profiles where LEAVE is missing or canCreate/canRead is false for non-read-only profiles.
     */
    public void patchLeavePermissions() {
        log.info("Starting Patch: LEAVE permissions");
        List<Profile> allProfiles = profileRepository.findByIsDeletedFalse();
        int patchCount = 0;

        for (Profile profile : allProfiles) {
            boolean isReadOnly = profile.getProfileName() != null && profile.getProfileName().contains("Read Only");
            boolean isAdmin = profile.getProfileName() != null &&
                    (profile.getProfileName().contains("Administrator") || profile.getProfileName().contains("Manager"));

            List<Profile.ObjectPermission> permissions = profile.getObjectPermissions();
            if (permissions == null) {
                permissions = new ArrayList<>();
                profile.setObjectPermissions(permissions);
            }

            Profile.ObjectPermission leavePerm = permissions.stream()
                    .filter(p -> "LEAVE".equalsIgnoreCase(p.getObjectName()))
                    .findFirst().orElse(null);

            boolean needsSave = false;

            if (leavePerm == null) {
                Profile.ObjectPermission newPerm = isAdmin ? createFullAccessPermission("LEAVE")
                        : isReadOnly ? createReadOnlyPermission("LEAVE")
                        : createStandardPermission("LEAVE");
                permissions.add(newPerm);
                needsSave = true;
            } else if (!isReadOnly) {
                // For all non-read-only profiles, canCreate and canRead must be true
                if (!Boolean.TRUE.equals(leavePerm.getCanCreate()) || !Boolean.TRUE.equals(leavePerm.getCanRead())) {
                    leavePerm.setCanCreate(true);
                    leavePerm.setCanRead(true);
                    if (isAdmin) {
                        leavePerm.setCanEdit(true);
                        leavePerm.setCanDelete(true);
                        leavePerm.setCanViewAll(true);
                        leavePerm.setCanModifyAll(true);
                    }
                    needsSave = true;
                }
            }

            if (needsSave) {
                profileRepository.save(profile);
                patchCount++;
                log.info("Patched LEAVE permission for profile: {}", profile.getProfileName());
            }
        }
        log.info("Completed LEAVE Patch: Updated {} profiles", patchCount);
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
