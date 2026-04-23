package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.ContractBillingCycle;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContractBillingCycleRepository extends MongoRepository<ContractBillingCycle, String> {

    List<ContractBillingCycle> findByContractIdAndTenantId(String contractId, String tenantId);

    List<ContractBillingCycle> findByTenantIdAndStatus(String tenantId, String status);
}
