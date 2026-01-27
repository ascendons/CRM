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

    // Count queries
    long countByIsDeletedFalse();
}
