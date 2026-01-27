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

    // Count queries
    long countByIsDeletedFalse();
}
