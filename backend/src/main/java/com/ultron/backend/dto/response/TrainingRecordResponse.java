package com.ultron.backend.dto.response;

import com.ultron.backend.domain.enums.TrainingType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class TrainingRecordResponse {
    private String id;
    private String userId;
    private String trainingName;
    private TrainingType trainingType;
    private LocalDate completedDate;
    private String trainerName;
    private Double score;
    private Boolean passed;
    private String certAttachmentUrl;
    private LocalDateTime createdAt;
    private String createdBy;
}
