package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.LeavePolicy;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LeavePolicyRepository extends MongoRepository<LeavePolicy, String> {

    Optional<LeavePolicy> findByTenantId(String tenantId);
}
