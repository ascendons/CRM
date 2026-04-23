package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.EngineerLocation;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EngineerLocationRepository extends MongoRepository<EngineerLocation, String> {

    Optional<EngineerLocation> findTopByTenantIdAndEngineerIdOrderByTimestampDesc(String tenantId, String engineerId);

    List<EngineerLocation> findTop20ByTenantIdAndEngineerIdOrderByTimestampDesc(String tenantId, String engineerId);

    @Aggregation(pipeline = {
        "{ $match: { tenantId: ?0 } }",
        "{ $sort: { timestamp: -1 } }",
        "{ $group: { _id: '$engineerId', doc: { $first: '$$ROOT' } } }",
        "{ $replaceRoot: { newRoot: '$doc' } }"
    })
    List<EngineerLocation> findLatestPerEngineerByTenantId(String tenantId);
}
