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
     * Find lead by unique leadId (LEAD-YYYY-MM-XXXXX)
     */
    Optional<Lead> findByLeadId(String leadId);

    /**
     * Find lead by email (for duplicate detection)
     */
    Optional<Lead> findByEmail(String email);

    /**
     * Check if email already exists (excluding deleted leads)
     */
    boolean existsByEmailAndIsDeletedFalse(String email);

    /**
     * Find all leads by owner (excluding deleted)
     */
    List<Lead> findByLeadOwnerIdAndIsDeletedFalse(String ownerId);

    /**
     * Find all leads by status (excluding deleted)
     */
    List<Lead> findByLeadStatusAndIsDeletedFalse(LeadStatus status);

    /**
     * Find all active leads (not deleted)
     */
    List<Lead> findByIsDeletedFalse();

    /**
     * Find leads by company name (for enrichment lookup)
     */
    List<Lead> findByCompanyNameContainingIgnoreCaseAndIsDeletedFalse(String companyName);

    /**
     * Search leads by name, email, or company (for autocomplete)
     */
    @Query("{ $or: [ " +
            "{ 'firstName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'lastName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'email': { $regex: ?0, $options: 'i' } }, " +
            "{ 'companyName': { $regex: ?0, $options: 'i' } } " +
            "], 'isDeleted': false }")
    List<Lead> searchLeads(String searchTerm);

    /**
     * Count leads by status (for dashboard stats)
     */
    long countByLeadStatusAndIsDeletedFalse(LeadStatus status);

    /**
     * Count leads by owner (for workload distribution)
     */
    long countByLeadOwnerIdAndIsDeletedFalse(String ownerId);

    /**
     * Get the latest lead for ID generation
     */
    Optional<Lead> findFirstByOrderByCreatedAtDesc();
}
