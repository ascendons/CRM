package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.ReviewerType;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
@Document(collection = "review_cycles")
public class ReviewCycle {
    @Id private String id;
    @Indexed(unique = true) private String cycleId;
    @Indexed private String tenantId;
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private ReviewerType reviewerType;
    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
