package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.KbArticle;
import com.ultron.backend.domain.enums.KbArticleStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KbArticleRepository extends MongoRepository<KbArticle, String> {

    List<KbArticle> findByTenantIdAndStatusAndIsDeletedFalse(String tenantId, KbArticleStatus status);

    List<KbArticle> findByTenantIdAndCategoryIdAndIsDeletedFalse(String tenantId, String categoryId);

    Optional<KbArticle> findByArticleIdAndTenantId(String articleId, String tenantId);

    Optional<KbArticle> findBySlugAndTenantId(String slug, String tenantId);

    List<KbArticle> findByTenantIdAndIsDeletedFalse(String tenantId);

    @Query("{ 'tenantId': ?1, 'isDeleted': false, $or: [ " +
            "{ 'title': { $regex: ?0, $options: 'i' } }, " +
            "{ 'body': { $regex: ?0, $options: 'i' } }, " +
            "{ 'searchKeywords': { $regex: ?0, $options: 'i' } }, " +
            "{ 'tags': { $regex: ?0, $options: 'i' } } " +
            "]}")
    List<KbArticle> searchByTenantId(String query, String tenantId);

    Optional<KbArticle> findFirstByOrderByCreatedAtDesc();
}
