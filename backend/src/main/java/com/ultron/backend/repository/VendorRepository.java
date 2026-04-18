package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Vendor;
import com.ultron.backend.domain.enums.VendorStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VendorRepository extends MongoRepository<Vendor, String> {

    Optional<Vendor> findByVendorCodeAndTenantId(String vendorCode, String tenantId);

    List<Vendor> findByTenantIdAndIsDeletedFalse(String tenantId);

    List<Vendor> findByTenantIdAndStatusAndIsDeletedFalse(String tenantId, VendorStatus status);

    List<Vendor> findByTenantIdAndCategoriesContainingAndIsDeletedFalse(String tenantId, String category);

    List<Vendor> findByTenantIdAndRatingGreaterThanEqualAndIsDeletedFalse(String tenantId, int rating);
}
