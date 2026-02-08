package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.DynamicProduct;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DynamicProductRepository extends MongoRepository<DynamicProduct, String> {

    Optional<DynamicProduct> findByProductId(String productId);

    // Full-text search using MongoDB text index
    @Query("{ $text: { $search: ?0 } }")
    Page<DynamicProduct> searchByText(String searchText, Pageable pageable);

    // Search by category
    Page<DynamicProduct> findByCategoryOrderByCreatedAtDesc(String category, Pageable pageable);

    // Find products with specific attribute key
    @Query("{ 'attributes.key': ?0 }")
    List<DynamicProduct> findByAttributeKey(String attributeKey);

    // Find products with specific attribute key-value pair
    @Query("{ 'attributes': { $elemMatch: { 'key': ?0, 'value': ?1 } } }")
    List<DynamicProduct> findByAttributeKeyAndValue(String attributeKey, String attributeValue);

    // Find products by attribute numeric range
    @Query("{ 'attributes': { $elemMatch: { 'key': ?0, 'numericValue': { $gte: ?1, $lte: ?2 } } } }")
    List<DynamicProduct> findByAttributeNumericRange(String attributeKey, Double min, Double max);

    // Get distinct values for an attribute key
    @Query(value = "{ 'attributes.key': ?0 }", fields = "{ 'attributes.$': 1 }")
    List<DynamicProduct> findDistinctValuesByAttributeKey(String attributeKey);

    // Get all distinct attribute keys across all products
    @Query(value = "{}", fields = "{ 'attributes.key': 1 }")
    List<DynamicProduct> findAllAttributeKeys();

    // Search by normalized tokens
    @Query("{ 'normalizedTokens': { $in: ?0 } }")
    Page<DynamicProduct> findByNormalizedTokensIn(List<String> tokens, Pageable pageable);

    // Count by category
    long countByCategory(String category);

    // Find by source file
    @Query("{ 'source.fileName': ?0 }")
    List<DynamicProduct> findBySourceFileName(String fileName);

    // Find non-deleted products
    Page<DynamicProduct> findByIsDeletedFalseOrderByCreatedAtDesc(Pageable pageable);
}
