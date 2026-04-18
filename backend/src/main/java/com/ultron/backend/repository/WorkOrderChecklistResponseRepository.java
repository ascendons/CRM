package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.WorkOrderChecklistResponse;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkOrderChecklistResponseRepository extends MongoRepository<WorkOrderChecklistResponse, String> {

    Optional<WorkOrderChecklistResponse> findByWorkOrderIdAndTenantId(String workOrderId, String tenantId);

    List<WorkOrderChecklistResponse> findByTenantIdAndEngineerId(String tenantId, String engineerId);
}
