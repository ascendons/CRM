package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.DispatchAssignment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DispatchAssignmentRepository extends MongoRepository<DispatchAssignment, String> {

    List<DispatchAssignment> findByTenantIdAndWorkOrderId(String tenantId, String workOrderId);

    List<DispatchAssignment> findByTenantIdAndEngineerId(String tenantId, String engineerId);

    Optional<DispatchAssignment> findTopByTenantIdAndWorkOrderIdOrderByDispatchedAtDesc(String tenantId, String workOrderId);
}
