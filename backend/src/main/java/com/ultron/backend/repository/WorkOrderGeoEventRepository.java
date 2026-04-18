package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.WorkOrderGeoEvent;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkOrderGeoEventRepository extends MongoRepository<WorkOrderGeoEvent, String> {

    List<WorkOrderGeoEvent> findByTenantIdAndWorkOrderIdOrderByTimestampAsc(String tenantId, String workOrderId);

    List<WorkOrderGeoEvent> findByTenantIdAndEngineerId(String tenantId, String engineerId);
}
