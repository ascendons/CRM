package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.ReviewStatus;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
@Document(collection = "performance_reviews")
public class PerformanceReview {
    @Id private String id;
    @Indexed(unique = true) private String reviewId;
    @Indexed private String tenantId;
    private String cycleId;
    private String revieweeId;
    private String reviewerId;
    private List<Rating> ratings;
    private Double overallScore;
    private String summary;
    private ReviewStatus status;
    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Rating {
        private String competency;
        private Integer score;
        private String comment;
    }
}
