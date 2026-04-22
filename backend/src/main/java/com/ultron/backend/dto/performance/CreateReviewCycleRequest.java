package com.ultron.backend.dto.performance;
import com.ultron.backend.domain.enums.ReviewerType;
import lombok.Data;
import java.time.LocalDate;
@Data
public class CreateReviewCycleRequest {
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private ReviewerType reviewerType;
}
