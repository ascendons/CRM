package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Dealer;
import com.ultron.backend.domain.enums.DealerStatus;
import com.ultron.backend.domain.enums.DealerTier;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DealerRepository extends MongoRepository<Dealer, String> {

    Optional<Dealer> findByDealerCodeAndTenantId(String dealerCode, String tenantId);

    List<Dealer> findByTenantIdAndIsDeletedFalse(String tenantId);

    List<Dealer> findByTenantIdAndStatusAndIsDeletedFalse(String tenantId, DealerStatus status);

    List<Dealer> findByTenantIdAndTierAndIsDeletedFalse(String tenantId, DealerTier tier);

    List<Dealer> findByTenantIdAndTerritoryAndIsDeletedFalse(String tenantId, String territory);
}
