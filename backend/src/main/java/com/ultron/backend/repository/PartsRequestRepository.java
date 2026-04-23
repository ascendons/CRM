package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.PartsRequest;
import com.ultron.backend.domain.enums.PartsRequestStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PartsRequestRepository extends MongoRepository<PartsRequest, String> {

    Optional<PartsRequest> findByRequestNumberAndTenantId(String requestNumber, String tenantId);

    List<PartsRequest> findByTenantIdAndIsDeletedFalse(String tenantId);

    List<PartsRequest> findByTenantIdAndWorkOrderIdAndIsDeletedFalse(String tenantId, String workOrderId);

    List<PartsRequest> findByTenantIdAndEngineerIdAndIsDeletedFalse(String tenantId, String engineerId);

    List<PartsRequest> findByTenantIdAndStatusAndIsDeletedFalse(String tenantId, PartsRequestStatus status);
}
