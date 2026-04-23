package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.DealerPerformance;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DealerPerformanceRepository extends MongoRepository<DealerPerformance, String> {

    Optional<DealerPerformance> findByTenantIdAndDealerIdAndMonthAndYear(
            String tenantId, String dealerId, int month, int year);

    List<DealerPerformance> findByTenantIdAndMonthAndYear(String tenantId, int month, int year);

    List<DealerPerformance> findByTenantIdAndDealerId(String tenantId, String dealerId);
}
