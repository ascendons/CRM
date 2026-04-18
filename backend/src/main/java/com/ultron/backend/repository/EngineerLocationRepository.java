package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.EngineerLocation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EngineerLocationRepository extends MongoRepository<EngineerLocation, String> {

    Optional<EngineerLocation> findTopByTenantIdAndEngineerIdOrderByTimestampDesc(String tenantId, String engineerId);
}
