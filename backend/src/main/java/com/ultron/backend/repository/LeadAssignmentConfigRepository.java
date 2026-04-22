package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.LeadAssignmentConfig;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeadAssignmentConfigRepository extends MongoRepository<LeadAssignmentConfig, String> {

    List<LeadAssignmentConfig> findByTenantId(String tenantId);

    boolean existsByTenantId(String tenantId);
}
