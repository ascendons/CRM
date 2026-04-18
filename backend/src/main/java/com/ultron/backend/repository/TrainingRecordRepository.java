package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.TrainingRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrainingRecordRepository extends MongoRepository<TrainingRecord, String> {

    List<TrainingRecord> findByTenantIdAndUserIdAndIsDeletedFalse(String tenantId, String userId);

    List<TrainingRecord> findByTenantIdAndIsDeletedFalse(String tenantId);
}
