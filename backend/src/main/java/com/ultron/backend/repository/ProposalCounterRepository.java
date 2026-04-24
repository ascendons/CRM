package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.ProposalCounter;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProposalCounterRepository extends MongoRepository<ProposalCounter, String> {

    Optional<ProposalCounter> findByTenantIdAndFinancialYear(String tenantId, String financialYear);
}
