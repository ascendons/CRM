package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Asset;
import com.ultron.backend.domain.enums.AssetStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AssetRepository extends MongoRepository<Asset, String> {

    Optional<Asset> findByAssetCodeAndTenantId(String assetCode, String tenantId);

    List<Asset> findByTenantIdAndIsDeletedFalse(String tenantId);

    List<Asset> findByTenantIdAndAccountIdAndIsDeletedFalse(String tenantId, String accountId);

    List<Asset> findByTenantIdAndStatusAndIsDeletedFalse(String tenantId, AssetStatus status);

    List<Asset> findByTenantIdAndCategoryIdAndIsDeletedFalse(String tenantId, String categoryId);

    List<Asset> findByTenantIdAndWarrantyExpiryBeforeAndIsDeletedFalse(String tenantId, LocalDate date);

    boolean existsBySerialNoAndTenantId(String serialNo, String tenantId);
}
