package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.EscalationLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EscalationLogRepository extends MongoRepository<EscalationLog, String> {

    List<EscalationLog> findByTenantIdOrderByTriggeredAtDesc(String tenantId);

    List<EscalationLog> findByTenantIdAndEntityTypeAndEntityId(
            String tenantId, String entityType, String entityId);

    List<EscalationLog> findByTenantIdAndResolvedAtIsNull(String tenantId);
}
