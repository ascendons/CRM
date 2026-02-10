package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Opportunity;
import com.ultron.backend.domain.enums.OpportunityStage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface OpportunityRepository extends MongoRepository<Opportunity, String> {

    /**
     * Find opportunity by unique opportunityId and tenantId (OPP-YYYY-MM-XXXXX)
     * MULTI-TENANT SAFE
     */
    Optional<Opportunity> findByOpportunityIdAndTenantId(String opportunityId, String tenantId);

    /**
     * Check if opportunity name already exists within tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    boolean existsByOpportunityNameAndTenantIdAndIsDeletedFalse(String opportunityName, String tenantId);

    /**
     * Find all active opportunities for a specific tenant (not deleted)
     * MULTI-TENANT SAFE
     */
    List<Opportunity> findByTenantIdAndIsDeletedFalse(String tenantId);

    /**
     * Find opportunities by account and tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<Opportunity> findByAccountIdAndTenantIdAndIsDeletedFalse(String accountId, String tenantId);

    /**
     * Find opportunities by contact and tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<Opportunity> findByPrimaryContactIdAndTenantIdAndIsDeletedFalse(String contactId, String tenantId);

    /**
     * Find opportunities by stage and tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<Opportunity> findByStageAndTenantIdAndIsDeletedFalse(OpportunityStage stage, String tenantId);

    /**
     * Find opportunities by owner and tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<Opportunity> findByOwnerIdAndTenantIdAndIsDeletedFalse(String ownerId, String tenantId);

    /**
     * Count total opportunities for tenant
     * MULTI-TENANT SAFE
     */
    long countByTenantIdAndIsDeletedFalse(String tenantId);

    /**
     * Count opportunities by stage and tenant (for dashboard stats)
     * MULTI-TENANT SAFE
     */
    long countByStageAndTenantIdAndIsDeletedFalse(OpportunityStage stage, String tenantId);

    /**
     * Count opportunities by owner and tenant (for workload distribution)
     * MULTI-TENANT SAFE
     */
    long countByOwnerIdAndTenantIdAndIsDeletedFalse(String ownerId, String tenantId);

    /**
     * Search opportunities by name, account, or description within tenant
     * MULTI-TENANT SAFE
     */
    @Query("{ 'tenantId': ?1, 'isDeleted': false, '$or': [ " +
            "{ 'opportunityName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'accountName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'description': { $regex: ?0, $options: 'i' } } ] }")
    List<Opportunity> searchOpportunitiesByTenantId(String searchTerm, String tenantId);

    /**
     * Find opportunities by expected close date range within tenant
     * MULTI-TENANT SAFE
     */
    @Query("{ 'tenantId': ?2, 'isDeleted': false, 'expectedCloseDate': { $gte: ?0, $lte: ?1 } }")
    List<Opportunity> findByExpectedCloseDateBetweenAndTenantId(LocalDate startDate, LocalDate endDate, String tenantId);

    /**
     * Find closed opportunities within tenant (WON or LOST)
     * MULTI-TENANT SAFE
     */
    @Query("{ 'tenantId': ?0, 'isDeleted': false, 'stage': { $in: ['CLOSED_WON', 'CLOSED_LOST'] } }")
    List<Opportunity> findClosedOpportunitiesByTenantId(String tenantId);

    /**
     * Find open opportunities within tenant (not WON or LOST)
     * MULTI-TENANT SAFE
     */
    @Query("{ 'tenantId': ?0, 'isDeleted': false, 'stage': { $nin: ['CLOSED_WON', 'CLOSED_LOST'] } }")
    List<Opportunity> findOpenOpportunitiesByTenantId(String tenantId);

    /**
     * Get the latest opportunity for a specific tenant (for ID generation)
     * MULTI-TENANT SAFE
     */
    Optional<Opportunity> findFirstByTenantIdOrderByCreatedAtDesc(String tenantId);

    // ===== DANGEROUS METHODS - DO NOT USE IN BUSINESS LOGIC =====
    // These methods are ONLY for admin/migration purposes

    /**
     * ⚠️ ADMIN ONLY - Find opportunity by opportunityId across ALL tenants
     * Use with EXTREME caution
     */
    Optional<Opportunity> findByOpportunityId(String opportunityId);

    /**
     * ⚠️ ADMIN ONLY - Get all opportunities across ALL tenants
     * Use with EXTREME caution
     */
    List<Opportunity> findByIsDeletedFalse();

    /**
     * ⚠️ ADMIN ONLY - Count all opportunities across ALL tenants
     * Use with EXTREME caution
     */
    long countByIsDeletedFalse();

    /**
     * ⚠️ ADMIN ONLY - Get latest opportunity across ALL tenants
     * Use ONLY for global ID generation
     */
    Optional<Opportunity> findFirstByOrderByCreatedAtDesc();
}
