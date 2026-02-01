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

    Optional<Product> findByProductId(String productId);

    Optional<Product> findBySku(String sku);

    boolean existsBySku(String sku);

    List<Product> findByIsDeletedFalse();
    Page<Product> findByIsDeletedFalse(Pageable pageable);

    List<Product> findByStatusAndIsDeletedFalse(ProductStatus status);
    Page<Product> findByStatusAndIsDeletedFalse(ProductStatus status, Pageable pageable);

    List<Product> findByCategoryAndIsDeletedFalse(String category);
    Page<Product> findByCategoryAndIsDeletedFalse(String category, Pageable pageable);

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

    @Query("{ 'isDeleted': false, 'isActive': true }")
    List<Product> findActiveProducts();

    @Query("{ 'isDeleted': false, 'isActive': true }")
    Page<Product> findActiveProducts(Pageable pageable);
}
