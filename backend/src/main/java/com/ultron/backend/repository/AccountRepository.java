package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Account;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends MongoRepository<Account, String> {

    /**
     * Find account by unique accountId and tenantId (ACC-YYYY-MM-XXXXX)
     * MULTI-TENANT SAFE
     */
    Optional<Account> findByAccountIdAndTenantId(String accountId, String tenantId);

    /**
     * Find account by name and tenantId (for duplicate detection)
     * MULTI-TENANT SAFE
     */
    Optional<Account> findByAccountNameAndTenantId(String accountName, String tenantId);

    /**
     * Check if account name already exists within tenant (excluding deleted accounts)
     * MULTI-TENANT SAFE
     */
    boolean existsByAccountNameAndTenantIdAndIsDeletedFalse(String accountName, String tenantId);

    /**
     * Find all accounts by owner and tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<Account> findByOwnerIdAndTenantIdAndIsDeletedFalse(String ownerId, String tenantId);

    /**
     * Find all active accounts for a specific tenant (not deleted)
     * MULTI-TENANT SAFE
     */
    List<Account> findByTenantIdAndIsDeletedFalse(String tenantId);

    /**
     * Find accounts by status within tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<Account> findByAccountStatusAndTenantIdAndIsDeletedFalse(String status, String tenantId);

    /**
     * Search accounts by name, website, phone, or accountId within tenant (for autocomplete)
     * MULTI-TENANT SAFE
     */
    @Query("{ 'tenantId': ?1, 'isDeleted': false, '$or': [ " +
            "{ 'accountName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'website': { $regex: ?0, $options: 'i' } }, " +
            "{ 'phone': { $regex: ?0, $options: 'i' } }, " +
            "{ 'accountId': { $regex: ?0, $options: 'i' } } " +
            "] }")
    List<Account> searchAccountsByTenantId(String searchTerm, String tenantId);

    /**
     * Count accounts by status and tenant (for dashboard stats)
     * MULTI-TENANT SAFE
     */
    long countByAccountStatusAndTenantIdAndIsDeletedFalse(String status, String tenantId);

    /**
     * Count accounts by owner and tenant (for workload distribution)
     * MULTI-TENANT SAFE
     */
    long countByOwnerIdAndTenantIdAndIsDeletedFalse(String ownerId, String tenantId);

    /**
     * Count total accounts for tenant
     * MULTI-TENANT SAFE
     */
    long countByTenantIdAndIsDeletedFalse(String tenantId);

    /**
     * Get the latest account for a specific tenant (for ID generation)
     * MULTI-TENANT SAFE
     */
    Optional<Account> findFirstByTenantIdOrderByCreatedAtDesc(String tenantId);

    // ===== DANGEROUS METHODS - DO NOT USE IN BUSINESS LOGIC =====
    // These methods are ONLY for admin/migration purposes

    /**
     * ⚠️ ADMIN ONLY - Find account by accountId across ALL tenants
     * Use with EXTREME caution
     */
    Optional<Account> findByAccountId(String accountId);

    /**
     * ⚠️ ADMIN ONLY - Find account by name across ALL tenants
     * Use with EXTREME caution
     */
    Optional<Account> findByAccountNameAndIsDeletedFalse(String accountName);

    /**
     * ⚠️ ADMIN ONLY - Check if account name exists across ALL tenants
     * Use with EXTREME caution
     */
    boolean existsByAccountNameAndIsDeletedFalse(String accountName);

    /**
     * ⚠️ ADMIN ONLY - Find accounts by owner across ALL tenants
     * Use with EXTREME caution
     */
    List<Account> findByOwnerIdAndIsDeletedFalse(String ownerId);

    /**
     * ⚠️ ADMIN ONLY - Get all accounts across ALL tenants
     * Use with EXTREME caution
     */
    List<Account> findByIsDeletedFalse();

    /**
     * ⚠️ ADMIN ONLY - Search accounts across ALL tenants
     * Use with EXTREME caution
     */
    @Query("{ 'isDeleted': false, '$or': [ " +
            "{ 'accountName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'website': { $regex: ?0, $options: 'i' } }, " +
            "{ 'phone': { $regex: ?0, $options: 'i' } }, " +
            "{ 'accountId': { $regex: ?0, $options: 'i' } } " +
            "] }")
    List<Account> searchAccounts(String searchTerm);

    /**
     * ⚠️ ADMIN ONLY - Count all accounts across ALL tenants
     * Use with EXTREME caution
     */
    long countByIsDeletedFalse();

    /**
     * ⚠️ ADMIN ONLY - Count accounts by status across ALL tenants
     * Use with EXTREME caution
     */
    long countByAccountStatus(String status);

    /**
     * ⚠️ ADMIN ONLY - Get latest account across ALL tenants
     * Use ONLY for global ID generation
     */
    Optional<Account> findFirstByOrderByCreatedAtDesc();
}
