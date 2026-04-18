package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.TrainingType;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateTrainingRecordRequest {

    @NotBlank
    private String userId;

    @NotBlank
    private String trainingName;

    private TrainingType trainingType;
    private LocalDate completedDate;
    private String trainerName;
    private Double score;
    private Boolean passed;
    private String certAttachmentUrl;
}
