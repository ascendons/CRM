package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Role;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoleRepository extends MongoRepository<Role, String> {

    // Find by business ID
    Optional<Role> findByRoleId(String roleId);

    // Find by name
    Optional<Role> findByRoleName(String roleName);

    // Check existence
    boolean existsByRoleId(String roleId);
    boolean existsByRoleName(String roleName);

    // Find all active roles
    List<Role> findByIsDeletedFalse();

    // Find by status
    List<Role> findByIsActiveAndIsDeletedFalse(Boolean isActive);

    // Find by parent
    List<Role> findByParentRoleIdAndIsDeletedFalse(String parentRoleId);

    // Find by level
    List<Role> findByLevelAndIsDeletedFalse(Integer level);

    // Find root roles (no parent)
    List<Role> findByParentRoleIdIsNullAndIsDeletedFalse();

    // Search roles
    @Query("{ 'roleName': { $regex: ?0, $options: 'i' }, 'isDeleted': false }")
    List<Role> searchRoles(String searchTerm);

    // ===== MULTI-TENANT QUERIES (Lean RBAC) =====

    /**
     * Find all roles for a specific tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<Role> findByTenantIdAndIsDeletedFalse(String tenantId);

    /**
     * Find role by roleId and tenantId
     * MULTI-TENANT SAFE
     */
    Optional<Role> findByRoleIdAndTenantId(String roleId, String tenantId);

    /**
     * Find role by roleName and tenantId (for role lookup by name)
     * MULTI-TENANT SAFE
     */
    Optional<Role> findByRoleNameAndTenantId(String roleName, String tenantId);

    /**
     * Find active roles for a tenant
     * MULTI-TENANT SAFE
     */
    List<Role> findByTenantIdAndIsActiveAndIsDeletedFalse(String tenantId, Boolean isActive);

    /**
     * Find child roles for a parent within tenant
     * MULTI-TENANT SAFE
     */
    List<Role> findByTenantIdAndParentRoleIdAndIsDeletedFalse(String tenantId, String parentRoleId);

    /**
     * Find system roles (templates for new tenants)
     */
    List<Role> findByIsSystemRoleTrueAndIsDeletedFalse();

    /**
     * Find system role by name (for templates)
     */
    Optional<Role> findByRoleNameAndIsSystemRoleTrue(String roleName);

    /**
     * Check if role name exists within tenant
     * MULTI-TENANT SAFE
     */
    boolean existsByRoleNameAndTenantId(String roleName, String tenantId);

    /**
     * Find roles by role IDs within tenant
     * Used for lead assignment configuration validation
     * MULTI-TENANT SAFE
     */
    List<Role> findByTenantIdAndRoleIdIn(String tenantId, List<String> roleIds);

    // Count queries
    long countByIsDeletedFalse();

    /**
     * Count roles for a tenant
     * MULTI-TENANT SAFE
     */
    long countByTenantIdAndIsDeletedFalse(String tenantId);
}
