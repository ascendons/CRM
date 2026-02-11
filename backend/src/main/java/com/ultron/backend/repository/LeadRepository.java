package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Lead;
import com.ultron.backend.domain.enums.LeadStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeadRepository extends MongoRepository<Lead, String> {

    /**
     * Find lead by unique leadId and tenantId (LEAD-YYYY-MM-XXXXX)
     * MULTI-TENANT SAFE
     */
    Optional<Lead> findByLeadIdAndTenantId(String leadId, String tenantId);

    /**
     * Find lead by email and tenantId (for duplicate detection)
     * MULTI-TENANT SAFE
     */
    Optional<Lead> findByEmailAndTenantId(String email, String tenantId);

    /**
     * Check if email already exists within tenant (excluding deleted leads)
     * MULTI-TENANT SAFE
     */
    boolean existsByEmailAndTenantIdAndIsDeletedFalse(String email, String tenantId);

    /**
     * Find all leads by owner and tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<Lead> findByLeadOwnerIdAndTenantIdAndIsDeletedFalse(String ownerId, String tenantId);

    /**
     * Find all leads by status and tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<Lead> findByLeadStatusAndTenantIdAndIsDeletedFalse(LeadStatus status, String tenantId);

    /**
     * Find all active leads for a specific tenant (not deleted)
     * MULTI-TENANT SAFE
     */
    List<Lead> findByTenantIdAndIsDeletedFalse(String tenantId);

    /**
     * Find leads by company name within tenant (for enrichment lookup)
     * MULTI-TENANT SAFE
     */
    List<Lead> findByCompanyNameContainingIgnoreCaseAndTenantIdAndIsDeletedFalse(String companyName, String tenantId);

    /**
     * Search leads by name, email, or company within tenant (for autocomplete)
     * MULTI-TENANT SAFE
     */
    @Query("{ 'tenantId': ?1, $or: [ " +
            "{ 'firstName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'lastName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'email': { $regex: ?0, $options: 'i' } }, " +
            "{ 'companyName': { $regex: ?0, $options: 'i' } } " +
            "], 'isDeleted': false }")
    List<Lead> searchLeadsByTenantId(String searchTerm, String tenantId);

    /**
     * Count leads by status and tenant (for dashboard stats)
     * MULTI-TENANT SAFE
     */
    long countByLeadStatusAndTenantIdAndIsDeletedFalse(LeadStatus status, String tenantId);

    /**
     * Count leads by owner and tenant (for workload distribution)
     * MULTI-TENANT SAFE
     */
    long countByLeadOwnerIdAndTenantIdAndIsDeletedFalse(String ownerId, String tenantId);

    /**
     * Count total leads for tenant
     * MULTI-TENANT SAFE
     */
    long countByTenantIdAndIsDeletedFalse(String tenantId);

    /**
     * Get the latest lead for a specific tenant (for ID generation)
     * MULTI-TENANT SAFE
     */
    Optional<Lead> findFirstByTenantIdOrderByCreatedAtDesc(String tenantId);

    /**
     * Find all leads assigned to specific users (for least-loaded strategy)
     * MULTI-TENANT SAFE
     */
    List<Lead> findByAssignedUserIdInAndIsDeletedFalse(List<String> userIds);

    // ===== DANGEROUS METHODS - DO NOT USE IN BUSINESS LOGIC =====
    // These methods are ONLY for admin/migration purposes

    /**
     * ⚠️ ADMIN ONLY - Find lead by leadId across ALL tenants
     * Use with EXTREME caution
     */
    Optional<Lead> findByLeadId(String leadId);

    /**
     * ⚠️ ADMIN ONLY - Find lead by email across ALL tenants
     * Use with EXTREME caution
     */
    Optional<Lead> findByEmail(String email);

    /**
     * ⚠️ ADMIN ONLY - Get latest lead across ALL tenants
     * Use ONLY for global ID generation
     */
    Optional<Lead> findFirstByOrderByCreatedAtDesc();
}
