package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.LeaveBalance;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for LeaveBalance entity with tenant-aware queries
 */
@Repository
public interface LeaveBalanceRepository extends MongoRepository<LeaveBalance, String> {

    // Find by user and year
    Optional<LeaveBalance> findByTenantIdAndUserIdAndYear(
            String tenantId, String userId, Integer year);

    // Find by tenant and year
    List<LeaveBalance> findByTenantIdAndYear(String tenantId, Integer year);

    // Find all balances for a user
    List<LeaveBalance> findByTenantIdAndUserIdOrderByYearDesc(
            String tenantId, String userId);

    // Check if balance exists
    boolean existsByTenantIdAndUserIdAndYear(
            String tenantId, String userId, Integer year);

    // Delete old balances (for cleanup)
    void deleteByTenantIdAndYearLessThan(String tenantId, Integer year);
}
