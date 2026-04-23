package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Survey;
import com.ultron.backend.domain.entity.SurveyResponse;
import com.ultron.backend.repository.SurveyRepository;
import com.ultron.backend.repository.SurveyResponseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SurveyService extends BaseTenantService {

    private final SurveyRepository surveyRepository;
    private final SurveyResponseRepository surveyResponseRepository;

    public Survey createSurvey(Survey survey) {
        String tenantId = getCurrentTenantId();
        survey.setSurveyId("SRV-" + System.currentTimeMillis());
        survey.setTenantId(tenantId);
        survey.setStatus("ACTIVE");
        survey.setDeleted(false);
        survey.setCreatedAt(LocalDateTime.now());
        survey.setCreatedBy(getCurrentUserId());
        survey.setUpdatedAt(LocalDateTime.now());
        survey.setUpdatedBy(getCurrentUserId());
        if (survey.getQuestions() != null) {
            survey.getQuestions().forEach(q -> {
                if (q.getQuestionId() == null) q.setQuestionId(UUID.randomUUID().toString());
            });
        }
        return surveyRepository.save(survey);
    }

    public List<Survey> getAll() {
        return surveyRepository.findByTenantIdAndIsDeletedFalse(getCurrentTenantId());
    }

    public Survey getById(String surveyId) {
        return surveyRepository.findBySurveyIdAndTenantId(surveyId, getCurrentTenantId())
                .orElseThrow(() -> new RuntimeException("Survey not found: " + surveyId));
    }

    public Survey updateSurvey(String surveyId, Survey updated) {
        Survey existing = getById(surveyId);
        if (updated.getTitle() != null) existing.setTitle(updated.getTitle());
        if (updated.getDescription() != null) existing.setDescription(updated.getDescription());
        if (updated.getQuestions() != null) existing.setQuestions(updated.getQuestions());
        if (updated.getTargetUserIds() != null) existing.setTargetUserIds(updated.getTargetUserIds());
        if (updated.getDueDate() != null) existing.setDueDate(updated.getDueDate());
        existing.setAnonymous(updated.isAnonymous());
        existing.setUpdatedAt(LocalDateTime.now());
        existing.setUpdatedBy(getCurrentUserId());
        return surveyRepository.save(existing);
    }

    public void deleteSurvey(String surveyId) {
        Survey survey = getById(surveyId);
        survey.setDeleted(true);
        survey.setUpdatedAt(LocalDateTime.now());
        surveyRepository.save(survey);
    }

    public SurveyResponse submitResponse(String surveyId, List<SurveyResponse.Answer> answers, boolean anonymous) {
        String tenantId = getCurrentTenantId();
        String respondentId = anonymous ? null : getCurrentUserId();
        SurveyResponse response = SurveyResponse.builder()
                .surveyId(surveyId)
                .tenantId(tenantId)
                .respondentId(respondentId)
                .answers(answers)
                .submittedAt(LocalDateTime.now())
                .build();
        return surveyResponseRepository.save(response);
    }

    public Map<String, Object> getResults(String surveyId) {
        Survey survey = getById(surveyId);
        List<SurveyResponse> responses = surveyResponseRepository.findBySurveyIdAndTenantId(surveyId, getCurrentTenantId());

        Map<String, Map<String, Integer>> tallies = new HashMap<>();
        for (SurveyResponse resp : responses) {
            if (resp.getAnswers() == null) continue;
            for (SurveyResponse.Answer answer : resp.getAnswers()) {
                tallies.computeIfAbsent(answer.getQuestionId(), k -> new HashMap<>())
                        .merge(answer.getValue() != null ? answer.getValue() : "", 1, Integer::sum);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("survey", survey);
        result.put("totalResponses", responses.size());
        result.put("tallies", tallies);
        return result;
    }
}
