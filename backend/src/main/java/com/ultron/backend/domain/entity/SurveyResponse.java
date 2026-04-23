package com.ultron.backend.domain.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "survey_responses")
public class SurveyResponse {

    @Id
    private String id;

    @Indexed
    private String surveyId;

    @Indexed
    private String tenantId;

    private String respondentId;
    private List<Answer> answers;
    private LocalDateTime submittedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Answer {
        private String questionId;
        private String value;
    }
}
