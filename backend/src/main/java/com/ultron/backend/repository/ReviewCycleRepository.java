package com.ultron.backend.repository;
import com.ultron.backend.domain.entity.ReviewCycle;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;
public interface ReviewCycleRepository extends MongoRepository<ReviewCycle, String> {
    List<ReviewCycle> findByTenantIdAndIsDeletedFalse(String tenantId);
    Optional<ReviewCycle> findByCycleIdAndTenantIdAndIsDeletedFalse(String cycleId, String tenantId);
}
