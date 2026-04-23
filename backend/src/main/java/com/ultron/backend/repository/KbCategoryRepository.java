package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.KbCategory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KbCategoryRepository extends MongoRepository<KbCategory, String> {

    List<KbCategory> findByTenantIdAndIsDeletedFalse(String tenantId);

    Optional<KbCategory> findByCategoryIdAndTenantId(String categoryId, String tenantId);

    List<KbCategory> findByTenantIdAndParentCategoryIdAndIsDeletedFalse(String tenantId, String parentCategoryId);
}
