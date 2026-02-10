package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Product;
import com.ultron.backend.domain.enums.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends MongoRepository<Product, String> {

    /**
     * Find product by ID and tenantId
     * MULTI-TENANT SAFE
     */
    Optional<Product> findByIdAndTenantId(String id, String tenantId);

    /**
     * Find product by unique productId and tenantId (PRD-YYYY-MM-XXXXX)
     * MULTI-TENANT SAFE
     */
    Optional<Product> findByProductIdAndTenantId(String productId, String tenantId);

    /**
     * Find product by SKU and tenantId (for duplicate detection)
     * MULTI-TENANT SAFE
     */
    Optional<Product> findBySkuAndTenantId(String sku, String tenantId);

    /**
     * Check if SKU already exists within tenant (excluding deleted products)
     * MULTI-TENANT SAFE
     */
    boolean existsBySkuAndTenantIdAndIsDeletedFalse(String sku, String tenantId);

    /**
     * Find all active products for a specific tenant (not deleted)
     * MULTI-TENANT SAFE
     */
    List<Product> findByTenantIdAndIsDeletedFalse(String tenantId);
    Page<Product> findByTenantIdAndIsDeletedFalse(String tenantId, Pageable pageable);

    /**
     * Find products by status and tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<Product> findByStatusAndTenantIdAndIsDeletedFalse(ProductStatus status, String tenantId);
    Page<Product> findByStatusAndTenantIdAndIsDeletedFalse(ProductStatus status, String tenantId, Pageable pageable);

    /**
     * Find products by category within tenant (excluding deleted)
     * MULTI-TENANT SAFE
     */
    List<Product> findByCategoryAndTenantIdAndIsDeletedFalse(String category, String tenantId);
    Page<Product> findByCategoryAndTenantIdAndIsDeletedFalse(String category, String tenantId, Pageable pageable);

    /**
     * Search products by name, SKU, or description within tenant (for autocomplete)
     * MULTI-TENANT SAFE
     */
    @Query("{ 'tenantId': ?1, 'isDeleted': false, '$or': [ " +
           "{ 'productName': { $regex: ?0, $options: 'i' } }, " +
           "{ 'sku': { $regex: ?0, $options: 'i' } }, " +
           "{ 'description': { $regex: ?0, $options: 'i' } } ] }")
    List<Product> searchProductsByTenantId(String searchTerm, String tenantId);

    @Query("{ 'tenantId': ?1, 'isDeleted': false, '$or': [ " +
           "{ 'productName': { $regex: ?0, $options: 'i' } }, " +
           "{ 'sku': { $regex: ?0, $options: 'i' } }, " +
           "{ 'description': { $regex: ?0, $options: 'i' } } ] }")
    Page<Product> searchProductsByTenantId(String searchTerm, String tenantId, Pageable pageable);

    /**
     * Find active products within tenant
     * MULTI-TENANT SAFE
     */
    @Query("{ 'tenantId': ?0, 'isDeleted': false, 'isActive': true }")
    List<Product> findActiveProductsByTenantId(String tenantId);

    @Query("{ 'tenantId': ?0, 'isDeleted': false, 'isActive': true }")
    Page<Product> findActiveProductsByTenantId(String tenantId, Pageable pageable);

    /**
     * Count products by status and tenant (for dashboard stats)
     * MULTI-TENANT SAFE
     */
    long countByStatusAndTenantIdAndIsDeletedFalse(ProductStatus status, String tenantId);

    /**
     * Count total products for tenant
     * MULTI-TENANT SAFE
     */
    long countByTenantIdAndIsDeletedFalse(String tenantId);

    /**
     * Get the latest product for a specific tenant (for ID generation)
     * MULTI-TENANT SAFE
     */
    Optional<Product> findFirstByTenantIdOrderByCreatedAtDesc(String tenantId);

    // ===== DANGEROUS METHODS - DO NOT USE IN BUSINESS LOGIC =====
    // These methods are ONLY for admin/migration purposes

    /**
     * ⚠️ ADMIN ONLY - Find product by productId across ALL tenants
     * Use with EXTREME caution
     */
    Optional<Product> findByProductId(String productId);

    /**
     * ⚠️ ADMIN ONLY - Find product by SKU across ALL tenants
     * Use with EXTREME caution
     */
    Optional<Product> findBySku(String sku);

    /**
     * ⚠️ ADMIN ONLY - Check if SKU exists across ALL tenants
     * Use with EXTREME caution
     */
    boolean existsBySku(String sku);

    /**
     * ⚠️ ADMIN ONLY - Find all products across ALL tenants
     * Use with EXTREME caution
     */
    List<Product> findByIsDeletedFalse();
    Page<Product> findByIsDeletedFalse(Pageable pageable);

    /**
     * ⚠️ ADMIN ONLY - Find products by status across ALL tenants
     * Use with EXTREME caution
     */
    List<Product> findByStatusAndIsDeletedFalse(ProductStatus status);
    Page<Product> findByStatusAndIsDeletedFalse(ProductStatus status, Pageable pageable);

    /**
     * ⚠️ ADMIN ONLY - Find products by category across ALL tenants
     * Use with EXTREME caution
     */
    List<Product> findByCategoryAndIsDeletedFalse(String category);
    Page<Product> findByCategoryAndIsDeletedFalse(String category, Pageable pageable);

    /**
     * ⚠️ ADMIN ONLY - Search products across ALL tenants
     * Use with EXTREME caution
     */
    @Query("{ 'isDeleted': false, '$or': [ " +
           "{ 'productName': { $regex: ?0, $options: 'i' } }, " +
           "{ 'sku': { $regex: ?0, $options: 'i' } }, " +
           "{ 'description': { $regex: ?0, $options: 'i' } } ] }")
    List<Product> searchProducts(String searchTerm);

    @Query("{ 'isDeleted': false, '$or': [ " +
           "{ 'productName': { $regex: ?0, $options: 'i' } }, " +
           "{ 'sku': { $regex: ?0, $options: 'i' } }, " +
           "{ 'description': { $regex: ?0, $options: 'i' } } ] }")
    Page<Product> searchProducts(String searchTerm, Pageable pageable);

    /**
     * ⚠️ ADMIN ONLY - Find active products across ALL tenants
     * Use with EXTREME caution
     */
    @Query("{ 'isDeleted': false, 'isActive': true }")
    List<Product> findActiveProducts();

    @Query("{ 'isDeleted': false, 'isActive': true }")
    Page<Product> findActiveProducts(Pageable pageable);

    /**
     * ⚠️ ADMIN ONLY - Get latest product across ALL tenants
     * Use ONLY for global ID generation
     */
    Optional<Product> findFirstByOrderByCreatedAtDesc();
}
