package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.ContractVisit;
import com.ultron.backend.domain.enums.ContractVisitStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContractVisitRepository extends MongoRepository<ContractVisit, String> {

    List<ContractVisit> findByContractIdAndTenantId(String contractId, String tenantId);

    List<ContractVisit> findByTenantIdAndStatus(String tenantId, ContractVisitStatus status);

    List<ContractVisit> findByTenantIdAndEngineerId(String tenantId, String engineerId);
}
