package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.SurveyQuestionType;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "surveys")
public class Survey {

    @Id
    private String id;

    @Indexed(unique = true)
    private String surveyId;

    @Indexed
    private String tenantId;

    private String title;
    private String description;
    private List<SurveyQuestion> questions;
    private boolean isAnonymous;
    private List<String> targetUserIds;
    private LocalDate dueDate;
    private String status;

    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SurveyQuestion {
        private String questionId;
        private String text;
        private SurveyQuestionType type;
        private List<String> options;
        private boolean required;
    }
}
