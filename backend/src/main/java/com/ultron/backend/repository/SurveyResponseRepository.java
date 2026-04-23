package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.SurveyResponse;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SurveyResponseRepository extends MongoRepository<SurveyResponse, String> {
    List<SurveyResponse> findBySurveyId(String surveyId);
    List<SurveyResponse> findBySurveyIdAndTenantId(String surveyId, String tenantId);
    boolean existsBySurveyIdAndRespondentId(String surveyId, String respondentId);
}
