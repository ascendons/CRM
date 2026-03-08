package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.UserShiftAssignment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository for user shift assignments
 */
@Repository
public interface UserShiftAssignmentRepository extends MongoRepository<UserShiftAssignment, String> {

    /**
     * Find assignments by tenant and user, ordered by effective date
     */
    List<UserShiftAssignment> findByTenantIdAndUserIdOrderByEffectiveDateDesc(String tenantId, String userId);

    /**
     * Find active assignment for user on a specific date
     */
    Optional<UserShiftAssignment> findByTenantIdAndUserIdAndEffectiveDateLessThanEqualAndIsDeletedFalse(
            String tenantId,
            String userId,
            LocalDate date
    );

    /**
     * Find all assignments for a shift
     */
    List<UserShiftAssignment> findByTenantIdAndShiftIdAndIsDeletedFalse(String tenantId, String shiftId);

    /**
     * Find all assignments for an office location
     */
    List<UserShiftAssignment> findByTenantIdAndOfficeLocationIdAndIsDeletedFalse(String tenantId, String officeLocationId);

    /**
     * Check if user has active assignment
     */
    boolean existsByTenantIdAndUserIdAndIsDeletedFalse(String tenantId, String userId);

    /**
     * Find all active assignments
     */
    List<UserShiftAssignment> findByTenantIdAndIsDeletedFalse(String tenantId);
}
