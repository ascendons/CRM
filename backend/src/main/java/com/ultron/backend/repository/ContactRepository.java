package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Contact;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContactRepository extends MongoRepository<Contact, String> {

    /**
     * Find contact by unique contactId and tenantId (CONT-YYYY-MM-XXXXX)
     * MULTI-TENANT SAFE
     */
    Optional<Contact> findByContactIdAndTenantId(String contactId, String tenantId);

    /**
     * Find contact by email and tenantId (for duplicate detection)
     * MULTI-TENANT SAFE
     */
    Optional<Contact> findByEmailAndTenantIdAndIsDeletedFalse(String email, String tenantId);

    /**
     * Check if email already exists within tenant (excluding deleted contacts)
     * MULTI-TENANT SAFE
     */
    boolean existsByEmailAndTenantIdAndIsDeletedFalse(String email, String tenantId);

    /**
     * Find all contacts by account and tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<Contact> findByAccountIdAndTenantIdAndIsDeletedFalse(String accountId, String tenantId);

    /**
     * Find all contacts by owner and tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<Contact> findByOwnerIdAndTenantIdAndIsDeletedFalse(String ownerId, String tenantId);

    /**
     * Find all active contacts for a specific tenant (not deleted)
     * MULTI-TENANT SAFE
     */
    List<Contact> findByTenantIdAndIsDeletedFalse(String tenantId);

    /**
     * Search contacts by name, email, phone, or accountName within tenant (for autocomplete)
     * MULTI-TENANT SAFE
     */
    @Query("{ 'tenantId': ?1, 'isDeleted': false, '$or': [ " +
            "{ 'firstName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'lastName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'email': { $regex: ?0, $options: 'i' } }, " +
            "{ 'phone': { $regex: ?0, $options: 'i' } }, " +
            "{ 'accountName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'contactId': { $regex: ?0, $options: 'i' } } " +
            "] }")
    List<Contact> searchContactsByTenantId(String searchTerm, String tenantId);

    /**
     * Count contacts by owner and tenant (for workload distribution)
     * MULTI-TENANT SAFE
     */
    long countByOwnerIdAndTenantIdAndIsDeletedFalse(String ownerId, String tenantId);

    /**
     * Count total contacts for tenant
     * MULTI-TENANT SAFE
     */
    long countByTenantIdAndIsDeletedFalse(String tenantId);

    /**
     * Get the latest contact for a specific tenant (for ID generation)
     * MULTI-TENANT SAFE
     */
    Optional<Contact> findFirstByTenantIdOrderByCreatedAtDesc(String tenantId);

    // ===== DANGEROUS METHODS - DO NOT USE IN BUSINESS LOGIC =====
    // These methods are ONLY for admin/migration purposes

    /**
     * ⚠️ ADMIN ONLY - Find contact by contactId across ALL tenants
     * Use with EXTREME caution
     */
    Optional<Contact> findByContactId(String contactId);

    /**
     * ⚠️ ADMIN ONLY - Find contact by email across ALL tenants
     * Use with EXTREME caution
     */
    Optional<Contact> findByEmailAndIsDeletedFalse(String email);

    /**
     * ⚠️ ADMIN ONLY - Check if email exists across ALL tenants
     * Use with EXTREME caution
     */
    boolean existsByEmailAndIsDeletedFalse(String email);

    /**
     * ⚠️ ADMIN ONLY - Find contacts by account across ALL tenants
     * Use with EXTREME caution
     */
    List<Contact> findByAccountIdAndIsDeletedFalse(String accountId);

    /**
     * ⚠️ ADMIN ONLY - Find contacts by owner across ALL tenants
     * Use with EXTREME caution
     */
    List<Contact> findByOwnerIdAndIsDeletedFalse(String ownerId);

    /**
     * ⚠️ ADMIN ONLY - Find all contacts across ALL tenants
     * Use with EXTREME caution
     */
    List<Contact> findByIsDeletedFalse();

    /**
     * ⚠️ ADMIN ONLY - Search contacts across ALL tenants
     * Use with EXTREME caution
     */
    @Query("{ 'isDeleted': false, '$or': [ " +
            "{ 'firstName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'lastName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'email': { $regex: ?0, $options: 'i' } }, " +
            "{ 'phone': { $regex: ?0, $options: 'i' } }, " +
            "{ 'accountName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'contactId': { $regex: ?0, $options: 'i' } } " +
            "] }")
    List<Contact> searchContacts(String searchTerm);

    /**
     * ⚠️ ADMIN ONLY - Count contacts across ALL tenants
     * Use with EXTREME caution
     */
    long countByIsDeletedFalse();

    /**
     * ⚠️ ADMIN ONLY - Get latest contact across ALL tenants
     * Use ONLY for global ID generation
     */
    Optional<Contact> findFirstByOrderByCreatedAtDesc();
}
