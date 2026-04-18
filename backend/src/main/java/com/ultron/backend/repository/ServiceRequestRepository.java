package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.ServiceRequest;
import com.ultron.backend.domain.enums.ServiceRequestStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceRequestRepository extends MongoRepository<ServiceRequest, String> {

    List<ServiceRequest> findByTenantIdAndIsDeletedFalse(String tenantId);

    List<ServiceRequest> findByTenantIdAndStatusAndIsDeletedFalse(String tenantId, ServiceRequestStatus status);

    List<ServiceRequest> findByTenantIdAndAccountIdAndIsDeletedFalse(String tenantId, String accountId);

    List<ServiceRequest> findByTenantIdAndAssetIdAndIsDeletedFalse(String tenantId, String assetId);
}
