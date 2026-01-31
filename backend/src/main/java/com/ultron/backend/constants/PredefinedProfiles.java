package com.ultron.backend.constants;

import com.ultron.backend.domain.entity.Profile;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

/**
 * Predefined profiles with hardcoded permissions.
 * These replace database-driven profiles with code-based configuration.
 */
public class PredefinedProfiles {

    public static final Profile SYSTEM_ADMINISTRATOR = Profile.builder()
            .id("PROFILE-00001")
            .profileId("PROFILE-00001")
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
                    createFullAccessPermission("ACTIVITY")
            ))
            .fieldPermissions(Arrays.asList())  // No restrictions
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
            .createdByName("System")
            .build();

    public static final Profile SALES_MANAGER = Profile.builder()
            .id("PROFILE-00002")
            .profileId("PROFILE-00002")
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
                    createFullAccessPermission("ACTIVITY")
            ))
            .fieldPermissions(Arrays.asList())
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
            .createdByName("System")
            .build();

    public static final Profile SALES_REPRESENTATIVE = Profile.builder()
            .id("PROFILE-00003")
            .profileId("PROFILE-00003")
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
                    createStandardPermission("ACTIVITY")
            ))
            .fieldPermissions(Arrays.asList())
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
            .createdByName("System")
            .build();

    public static final Profile READ_ONLY_USER = Profile.builder()
            .id("PROFILE-00004")
            .profileId("PROFILE-00004")
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
                    createReadOnlyPermission("ACTIVITY")
            ))
            .fieldPermissions(Arrays.asList())
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
            .createdByName("System")
            .build();

    // Helper methods to create permission objects

    private static Profile.ObjectPermission createFullAccessPermission(String objectName) {
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

    private static Profile.ObjectPermission createStandardPermission(String objectName) {
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

    private static Profile.ObjectPermission createReadOnlyPermission(String objectName) {
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

    private static Profile.ObjectPermission createNoAccessPermission(String objectName) {
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

    /**
     * Get all predefined profiles
     */
    public static List<Profile> getAllProfiles() {
        return Arrays.asList(
                SYSTEM_ADMINISTRATOR,
                SALES_MANAGER,
                SALES_REPRESENTATIVE,
                READ_ONLY_USER
        );
    }

    /**
     * Get only active profiles
     */
    public static List<Profile> getActiveProfiles() {
        return getAllProfiles().stream()
                .filter(Profile::getIsActive)
                .toList();
    }

    /**
     * Get profile by ID
     */
    public static Profile getProfileById(String id) {
        return getAllProfiles().stream()
                .filter(profile -> profile.getId().equals(id) || profile.getProfileId().equals(id))
                .findFirst()
                .orElse(null);
    }

    /**
     * Get profile by name
     */
    public static Profile getProfileByName(String name) {
        return getAllProfiles().stream()
                .filter(profile -> profile.getProfileName().equalsIgnoreCase(name))
                .findFirst()
                .orElse(null);
    }

    /**
     * Search profiles by query
     */
    public static List<Profile> searchProfiles(String query) {
        String lowerQuery = query.toLowerCase();
        return getAllProfiles().stream()
                .filter(profile ->
                    profile.getProfileName().toLowerCase().contains(lowerQuery) ||
                    (profile.getDescription() != null && profile.getDescription().toLowerCase().contains(lowerQuery))
                )
                .toList();
    }
}
