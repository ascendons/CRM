package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.User;
import com.ultron.backend.domain.enums.UserStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    // Find by business ID
    Optional<User> findByUserId(String userId);

    // Find by authentication fields
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);

    // Check existence
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);

    // Find all active (not deleted) users
    List<User> findByIsDeletedFalse();

    // Find by status
    List<User> findByStatusAndIsDeletedFalse(UserStatus status);

    // Find by role
    List<User> findByRoleIdAndIsDeletedFalse(String roleId);

    // Find by manager
    List<User> findByManagerIdAndIsDeletedFalse(String managerId);

    // Custom queries
    @Query("{ 'isDeleted': false, 'managerId': ?0 }")
    List<User> findActiveSubordinates(String managerId);

    @Query("{ 'security.lastLoginAt': { $lt: ?0 }, 'isDeleted': false }")
    List<User> findInactiveUsers(LocalDateTime since);

    @Query("{ $or: [ { 'profile.fullName': { $regex: ?0, $options: 'i' } }, { 'username': { $regex: ?0, $options: 'i' } }, { 'email': { $regex: ?0, $options: 'i' } } ], 'isDeleted': false }")
    List<User> searchUsers(String searchTerm);

    // Count queries
    long countByIsDeletedFalse();
    long countByStatusAndIsDeletedFalse(UserStatus status);
}
