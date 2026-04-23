package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Survey;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SurveyRepository extends MongoRepository<Survey, String> {
    Optional<Survey> findBySurveyIdAndTenantId(String surveyId, String tenantId);
    List<Survey> findByTenantIdAndIsDeletedFalse(String tenantId);
}
