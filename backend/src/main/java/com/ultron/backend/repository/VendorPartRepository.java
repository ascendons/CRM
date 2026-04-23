package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.VendorPart;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VendorPartRepository extends MongoRepository<VendorPart, String> {

    List<VendorPart> findByTenantIdAndPartIdAndIsDeletedFalse(String tenantId, String partId);

    List<VendorPart> findByTenantIdAndVendorIdAndIsDeletedFalse(String tenantId, String vendorId);

    List<VendorPart> findByTenantIdAndPreferredVendorTrueAndIsDeletedFalse(String tenantId);
}
