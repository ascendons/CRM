package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.TrainingType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "training_records")
public class TrainingRecord {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    private String userId;
    private String trainingName;
    private TrainingType trainingType;
    private LocalDate completedDate;
    private String trainerName;
    private Double score;
    private Boolean passed;
    private String certAttachmentUrl;

    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
