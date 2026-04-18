package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.GRN;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GRNRepository extends MongoRepository<GRN, String> {

    List<GRN> findByTenantIdAndIsDeletedFalse(String tenantId);

    List<GRN> findByTenantIdAndPoIdAndIsDeletedFalse(String tenantId, String poId);
}
