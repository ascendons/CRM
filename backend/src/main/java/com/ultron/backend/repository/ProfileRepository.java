package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Profile;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProfileRepository extends MongoRepository<Profile, String> {

    // Find by business ID
    Optional<Profile> findByProfileId(String profileId);

    // Find by name
    Optional<Profile> findByProfileName(String profileName);

    // Check existence
    boolean existsByProfileId(String profileId);
    boolean existsByProfileName(String profileName);

    // Find all active profiles
    List<Profile> findByIsDeletedFalse();

    // Find by status
    List<Profile> findByIsActiveAndIsDeletedFalse(Boolean isActive);

    // Search profiles
    @Query("{ 'profileName': { $regex: ?0, $options: 'i' }, 'isDeleted': false }")
    List<Profile> searchProfiles(String searchTerm);

    // ===== MULTI-TENANT QUERIES (Lean RBAC) =====

    /**
     * Find all profiles for a specific tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<Profile> findByTenantIdAndIsDeletedFalse(String tenantId);

    /**
     * Find profile by profileId and tenantId
     * MULTI-TENANT SAFE
     */
    Optional<Profile> findByProfileIdAndTenantId(String profileId, String tenantId);

    /**
     * Find profile by profileName and tenantId
     * MULTI-TENANT SAFE
     */
    Optional<Profile> findByProfileNameAndTenantId(String profileName, String tenantId);

    /**
     * Find active profiles for a tenant
     * MULTI-TENANT SAFE
     */
    List<Profile> findByTenantIdAndIsActiveAndIsDeletedFalse(String tenantId, Boolean isActive);

    /**
     * Find system profiles (templates for new tenants)
     */
    List<Profile> findByIsSystemProfileTrueAndIsDeletedFalse();

    /**
     * Find system profile by name (for templates)
     */
    Optional<Profile> findByProfileNameAndIsSystemProfileTrue(String profileName);

    /**
     * Check if profile name exists within tenant
     * MULTI-TENANT SAFE
     */
    boolean existsByProfileNameAndTenantId(String profileName, String tenantId);

    // Count queries
    long countByIsDeletedFalse();

    /**
     * Count profiles for a tenant
     * MULTI-TENANT SAFE
     */
    long countByTenantIdAndIsDeletedFalse(String tenantId);
}
