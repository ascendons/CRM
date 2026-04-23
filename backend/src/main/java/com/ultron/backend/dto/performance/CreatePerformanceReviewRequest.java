package com.ultron.backend.dto.performance;
import com.ultron.backend.domain.entity.PerformanceReview;
import lombok.Data;
import java.util.List;
@Data
public class CreatePerformanceReviewRequest {
    private String cycleId;
    private String revieweeId;
    private String reviewerId;
    private List<PerformanceReview.Rating> ratings;
    private String summary;
}
