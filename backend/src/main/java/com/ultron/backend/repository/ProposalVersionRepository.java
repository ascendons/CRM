package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.ProposalVersion;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProposalVersionRepository extends MongoRepository<ProposalVersion, String> {
    
    List<ProposalVersion> findByProposalIdAndTenantIdOrderByVersionDesc(String proposalId, String tenantId);
    
    Optional<ProposalVersion> findByProposalIdAndVersionAndTenantId(String proposalId, Integer version, String tenantId);
    
    Optional<ProposalVersion> findFirstByProposalIdAndTenantIdOrderByVersionDesc(String proposalId, String tenantId);
    
    void deleteByProposalIdAndTenantId(String proposalId, String tenantId);
}
