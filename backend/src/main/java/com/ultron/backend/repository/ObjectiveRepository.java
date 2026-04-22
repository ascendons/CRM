package com.ultron.backend.repository;
import com.ultron.backend.domain.entity.Objective;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;
public interface ObjectiveRepository extends MongoRepository<Objective, String> {
    List<Objective> findByTenantIdAndIsDeletedFalse(String tenantId);
    Optional<Objective> findByObjectiveIdAndTenantIdAndIsDeletedFalse(String objectiveId, String tenantId);
}
