package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Proposal;
import com.ultron.backend.domain.enums.ProposalSource;
import com.ultron.backend.domain.enums.ProposalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProposalRepository extends MongoRepository<Proposal, String> {

    /**
     * Find proposal by ID and tenantId
     * MULTI-TENANT SAFE
     */
    Optional<Proposal> findByIdAndTenantId(String id, String tenantId);

    /**
     * Find proposal by unique proposalId and tenantId (PROP-YYYY-MM-XXXXX)
     * MULTI-TENANT SAFE
     */
    Optional<Proposal> findByProposalIdAndTenantId(String proposalId, String tenantId);

    /**
     * Find all active proposals for a specific tenant (not deleted)
     * MULTI-TENANT SAFE
     */
    List<Proposal> findByTenantIdAndIsDeletedFalse(String tenantId);
    Page<Proposal> findByTenantIdAndIsDeletedFalse(String tenantId, Pageable pageable);

    /**
     * Find proposals by source and tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<Proposal> findBySourceAndSourceIdAndTenantIdAndIsDeletedFalse(ProposalSource source, String sourceId, String tenantId);
    Page<Proposal> findBySourceAndSourceIdAndTenantIdAndIsDeletedFalse(ProposalSource source, String sourceId, String tenantId, Pageable pageable);

    /**
     * Find proposals by specific entity IDs (Multi-reference support)
     */
    List<Proposal> findByLeadIdAndTenantIdAndIsDeletedFalse(String leadId, String tenantId);
    List<Proposal> findByOpportunityIdAndTenantIdAndIsDeletedFalse(String opportunityId, String tenantId);
    List<Proposal> findByAccountIdAndTenantIdAndIsDeletedFalse(String accountId, String tenantId);
    List<Proposal> findByContactIdAndTenantIdAndIsDeletedFalse(String contactId, String tenantId);

    /**
     * Find proposals by status and tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<Proposal> findByStatusAndTenantIdAndIsDeletedFalse(ProposalStatus status, String tenantId);
    Page<Proposal> findByStatusAndTenantIdAndIsDeletedFalse(ProposalStatus status, String tenantId, Pageable pageable);

    /**
     * Find proposals by owner and tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<Proposal> findByOwnerIdAndTenantIdAndIsDeletedFalse(String ownerId, String tenantId);
    Page<Proposal> findByOwnerIdAndTenantIdAndIsDeletedFalse(String ownerId, String tenantId, Pageable pageable);

    /**
     * Find expired proposals within tenant
     * MULTI-TENANT SAFE
     */
    @Query("{ 'tenantId': ?1, 'isDeleted': false, 'validUntil': { $lt: ?0 }, 'status': 'SENT' }")
    List<Proposal> findExpiredProposalsByTenantId(LocalDate currentDate, String tenantId);

    /**
     * Find proposals by status and source within tenant
     * MULTI-TENANT SAFE
     */
    @Query("{ 'tenantId': ?3, 'isDeleted': false, 'status': ?0, 'source': ?1, 'sourceId': ?2 }")
    List<Proposal> findByStatusAndSourceAndTenantId(ProposalStatus status, ProposalSource source, String sourceId, String tenantId);

    /**
     * Search proposals within tenant (for autocomplete)
     * MULTI-TENANT SAFE
     */
    @Query("{ 'tenantId': ?1, 'isDeleted': false, '$or': [ " +
           "{ 'title': { $regex: ?0, $options: 'i' } }, " +
           "{ 'customerName': { $regex: ?0, $options: 'i' } }, " +
           "{ 'proposalNumber': { $regex: ?0, $options: 'i' } } ] }")
    List<Proposal> searchProposalsByTenantId(String searchTerm, String tenantId);

    /**
     * Find active proposals by product within tenant
     * MULTI-TENANT SAFE
     */
    @Query("{ 'tenantId': ?1, 'isDeleted': false, 'lineItems.productId': ?0, 'status': { $in: ['DRAFT', 'SENT'] } }")
    List<Proposal> findActiveProposalsByProductIdAndTenantId(String productId, String tenantId);

    /**
     * Count proposals by status and tenant
     * MULTI-TENANT SAFE
     */
    long countByStatusAndTenantIdAndIsDeletedFalse(ProposalStatus status, String tenantId);

    /**
     * Count proposals by owner and tenant
     * MULTI-TENANT SAFE
     */
    long countByOwnerIdAndTenantIdAndIsDeletedFalse(String ownerId, String tenantId);

    /**
     * Count total proposals for tenant
     * MULTI-TENANT SAFE
     */
    long countByTenantIdAndIsDeletedFalse(String tenantId);

    /**
     * Get the latest proposal for a specific tenant (for ID generation)
     * MULTI-TENANT SAFE
     */
    Optional<Proposal> findFirstByTenantIdOrderByCreatedAtDesc(String tenantId);

    // ===== DANGEROUS METHODS - DO NOT USE IN BUSINESS LOGIC =====
    // These methods are ONLY for admin/migration purposes

    /**
     * ⚠️ ADMIN ONLY - Find proposal by proposalId across ALL tenants
     * Use with EXTREME caution
     */
    Optional<Proposal> findByProposalId(String proposalId);

    /**
     * ⚠️ ADMIN ONLY - Find all proposals across ALL tenants
     * Use with EXTREME caution
     */
    List<Proposal> findByIsDeletedFalse();
    Page<Proposal> findByIsDeletedFalse(Pageable pageable);

    /**
     * ⚠️ ADMIN ONLY - Find proposals by source across ALL tenants
     * Use with EXTREME caution
     */
    List<Proposal> findBySourceAndSourceIdAndIsDeletedFalse(ProposalSource source, String sourceId);
    Page<Proposal> findBySourceAndSourceIdAndIsDeletedFalse(ProposalSource source, String sourceId, Pageable pageable);

    /**
     * ⚠️ ADMIN ONLY - Find proposals by status across ALL tenants
     * Use with EXTREME caution
     */
    List<Proposal> findByStatusAndIsDeletedFalse(ProposalStatus status);
    Page<Proposal> findByStatusAndIsDeletedFalse(ProposalStatus status, Pageable pageable);

    /**
     * ⚠️ ADMIN ONLY - Find proposals by owner across ALL tenants
     * Use with EXTREME caution
     */
    List<Proposal> findByOwnerIdAndIsDeletedFalse(String ownerId);
    Page<Proposal> findByOwnerIdAndIsDeletedFalse(String ownerId, Pageable pageable);

    /**
     * ⚠️ ADMIN ONLY - Find expired proposals across ALL tenants
     * Use with EXTREME caution
     */
    @Query("{ 'isDeleted': false, 'validUntil': { $lt: ?0 }, 'status': 'SENT' }")
    List<Proposal> findExpiredProposals(LocalDate currentDate);

    /**
     * ⚠️ ADMIN ONLY - Find proposals by status and source across ALL tenants
     * Use with EXTREME caution
     */
    @Query("{ 'isDeleted': false, 'status': ?0, 'source': ?1, 'sourceId': ?2 }")
    List<Proposal> findByStatusAndSource(ProposalStatus status, ProposalSource source, String sourceId);

    /**
     * ⚠️ ADMIN ONLY - Search proposals across ALL tenants
     * Use with EXTREME caution
     */
    @Query("{ 'isDeleted': false, '$or': [ " +
           "{ 'title': { $regex: ?0, $options: 'i' } }, " +
           "{ 'customerName': { $regex: ?0, $options: 'i' } }, " +
           "{ 'proposalNumber': { $regex: ?0, $options: 'i' } } ] }")
    List<Proposal> searchProposals(String searchTerm);

    /**
     * ⚠️ ADMIN ONLY - Find active proposals by product across ALL tenants
     * Use with EXTREME caution
     */
    @Query("{ 'isDeleted': false, 'lineItems.productId': ?0, 'status': { $in: ['DRAFT', 'SENT'] } }")
    List<Proposal> findActiveProposalsByProductId(String productId);
}
