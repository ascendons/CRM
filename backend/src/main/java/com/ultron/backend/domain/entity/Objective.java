package com.ultron.backend.domain.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
@Document(collection = "objectives")
public class Objective {
    @Id private String id;
    @Indexed(unique = true) private String objectiveId;
    @Indexed private String tenantId;
    private String title;
    private String ownerId;
    private String quarter;
    private Integer year;
    private List<KeyResult> keyResults;
    private Double progress;
    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class KeyResult {
        private String title;
        private Double targetValue;
        private Double currentValue;
        private String unit;
    }
}
