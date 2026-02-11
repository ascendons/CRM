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

    // ===== MULTI-TENANT SAFE METHODS =====

    /**
     * Find user by userId and tenantId
     * MULTI-TENANT SAFE
     */
    Optional<User> findByUserIdAndTenantId(String userId, String tenantId);

    /**
     * Find user by email within tenant
     * MULTI-TENANT SAFE
     */
    Optional<User> findByEmailAndTenantId(String email, String tenantId);

    /**
     * Find user by username within tenant
     * MULTI-TENANT SAFE
     */
    Optional<User> findByUsernameAndTenantId(String username, String tenantId);

    /**
     * Check if email exists within tenant
     * MULTI-TENANT SAFE
     */
    boolean existsByEmailAndTenantId(String email, String tenantId);

    /**
     * Check if username exists within tenant
     * MULTI-TENANT SAFE
     */
    boolean existsByUsernameAndTenantId(String username, String tenantId);

    /**
     * Find all active users within tenant
     * MULTI-TENANT SAFE
     */
    List<User> findByTenantIdAndIsDeletedFalse(String tenantId);

    /**
     * Find users by status within tenant
     * MULTI-TENANT SAFE
     */
    List<User> findByStatusAndTenantIdAndIsDeletedFalse(UserStatus status, String tenantId);

    /**
     * Find users by role within tenant
     * MULTI-TENANT SAFE
     */
    List<User> findByRoleIdAndTenantIdAndIsDeletedFalse(String roleId, String tenantId);

    /**
     * Find users by manager within tenant
     * MULTI-TENANT SAFE
     */
    List<User> findByManagerIdAndTenantIdAndIsDeletedFalse(String managerId, String tenantId);

    /**
     * Find active subordinates within tenant
     * MULTI-TENANT SAFE
     */
    @Query("{ 'tenantId': ?1, 'isDeleted': false, 'managerId': ?0 }")
    List<User> findActiveSubordinatesByTenantId(String managerId, String tenantId);

    /**
     * Find inactive users within tenant
     * MULTI-TENANT SAFE
     */
    @Query("{ 'tenantId': ?1, 'security.lastLoginAt': { $lt: ?0 }, 'isDeleted': false }")
    List<User> findInactiveUsersByTenantId(LocalDateTime since, String tenantId);

    /**
     * Search users within tenant
     * MULTI-TENANT SAFE
     */
    @Query("{ 'tenantId': ?1, $or: [ " +
            "{ 'profile.fullName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'username': { $regex: ?0, $options: 'i' } }, " +
            "{ 'email': { $regex: ?0, $options: 'i' } } " +
            "], 'isDeleted': false }")
    List<User> searchUsersByTenantId(String searchTerm, String tenantId);

    /**
     * Count users within tenant
     * MULTI-TENANT SAFE
     */
    long countByTenantIdAndIsDeletedFalse(String tenantId);

    /**
     * Count users by status within tenant
     * MULTI-TENANT SAFE
     */
    long countByStatusAndTenantIdAndIsDeletedFalse(UserStatus status, String tenantId);

    /**
     * Get latest user for tenant (for ID generation)
     * MULTI-TENANT SAFE
     */
    Optional<User> findFirstByTenantIdOrderByCreatedAtDesc(String tenantId);

    // ===== DANGEROUS METHODS - ADMIN ONLY =====
    // ⚠️ These methods query across ALL tenants
    // Use with EXTREME caution - only for admin/migration purposes

    /**
     * ⚠️ ADMIN ONLY - Find user by userId across ALL tenants
     * Use with EXTREME caution
     */
    Optional<User> findByUserId(String userId);

    /**
     * ⚠️ ADMIN ONLY - Find user by email across ALL tenants
     * Use ONLY for authentication/login
     */
    Optional<User> findByEmail(String email);

    /**
     * ⚠️ ADMIN ONLY - Find user by username across ALL tenants
     * Use ONLY for authentication/login
     */
    Optional<User> findByUsername(String username);

    /**
     * ⚠️ ADMIN ONLY - Check email existence across ALL tenants
     * Use with EXTREME caution
     */
    boolean existsByEmail(String email);

    /**
     * ⚠️ ADMIN ONLY - Check username existence across ALL tenants
     * Use with EXTREME caution
     */
    boolean existsByUsername(String username);

    /**
     * ⚠️ ADMIN ONLY - Get all users across ALL tenants
     * Use with EXTREME caution
     */
    List<User> findByIsDeletedFalse();

    /**
     * ⚠️ ADMIN ONLY - Count all users across ALL tenants
     * Use with EXTREME caution
     */
    long countByIsDeletedFalse();

    /**
     * ⚠️ ADMIN ONLY - Get latest user across ALL tenants
     * Use ONLY for global ID generation
     */
    Optional<User> findFirstByOrderByCreatedAtDesc();
}
