package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.AssetCategory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetCategoryRepository extends MongoRepository<AssetCategory, String> {

    List<AssetCategory> findByTenantIdAndIsDeletedFalse(String tenantId);

    boolean existsByNameAndTenantIdAndIsDeletedFalse(String name, String tenantId);
}
