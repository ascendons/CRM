package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.RFQ;
import com.ultron.backend.domain.enums.RFQStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RFQRepository extends MongoRepository<RFQ, String> {

    List<RFQ> findByTenantIdAndIsDeletedFalse(String tenantId);

    List<RFQ> findByTenantIdAndStatusAndIsDeletedFalse(String tenantId, RFQStatus status);

    List<RFQ> findByTenantIdAndVendorIdsContainingAndIsDeletedFalse(String tenantId, String vendorId);

    // Trading flow: all RFQs linked to a source proposal
    List<RFQ> findByTenantIdAndSourceIdAndIsDeletedFalse(String tenantId, String sourceId);

    Optional<RFQ> findByIdAndTenantIdAndIsDeletedFalse(String id, String tenantId);

    boolean existsByRfqIdAndTenantId(String rfqId, String tenantId);
}
