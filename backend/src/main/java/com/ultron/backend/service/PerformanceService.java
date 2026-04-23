package com.ultron.backend.service;

import com.ultron.backend.domain.entity.PerformanceReview;
import com.ultron.backend.domain.entity.ReviewCycle;
import com.ultron.backend.domain.enums.ReviewStatus;
import com.ultron.backend.dto.performance.CreatePerformanceReviewRequest;
import com.ultron.backend.dto.performance.CreateReviewCycleRequest;
import com.ultron.backend.repository.PerformanceReviewRepository;
import com.ultron.backend.repository.ReviewCycleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service @RequiredArgsConstructor @Slf4j
public class PerformanceService extends BaseTenantService {
    private final ReviewCycleRepository cycleRepo;
    private final PerformanceReviewRepository reviewRepo;

    public ReviewCycle createCycle(CreateReviewCycleRequest req, String userId) {
        String tenantId = getCurrentTenantId();
        ReviewCycle cycle = ReviewCycle.builder()
                .cycleId("RC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .tenantId(tenantId).name(req.getName())
                .startDate(req.getStartDate()).endDate(req.getEndDate())
                .reviewerType(req.getReviewerType())
                .isDeleted(false).createdAt(LocalDateTime.now()).createdBy(userId)
                .updatedAt(LocalDateTime.now()).updatedBy(userId).build();
        return cycleRepo.save(cycle);
    }

    public List<ReviewCycle> getCycles() {
        return cycleRepo.findByTenantIdAndIsDeletedFalse(getCurrentTenantId());
    }

    public ReviewCycle getCycle(String cycleId) {
        return cycleRepo.findByCycleIdAndTenantIdAndIsDeletedFalse(cycleId, getCurrentTenantId())
                .orElseThrow(() -> new RuntimeException("Review cycle not found"));
    }

    public void deleteCycle(String cycleId, String userId) {
        ReviewCycle cycle = getCycle(cycleId);
        cycle.setDeleted(true); cycle.setUpdatedAt(LocalDateTime.now()); cycle.setUpdatedBy(userId);
        cycleRepo.save(cycle);
    }

    public PerformanceReview createReview(CreatePerformanceReviewRequest req, String userId) {
        String tenantId = getCurrentTenantId();
        PerformanceReview review = PerformanceReview.builder()
                .reviewId("REV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .tenantId(tenantId).cycleId(req.getCycleId())
                .revieweeId(req.getRevieweeId()).reviewerId(req.getReviewerId())
                .ratings(req.getRatings()).summary(req.getSummary())
                .status(ReviewStatus.DRAFT).isDeleted(false)
                .createdAt(LocalDateTime.now()).createdBy(userId)
                .updatedAt(LocalDateTime.now()).updatedBy(userId).build();
        return reviewRepo.save(review);
    }

    public List<PerformanceReview> getReviewsByCycle(String cycleId) {
        return reviewRepo.findByCycleIdAndTenantIdAndIsDeletedFalse(cycleId, getCurrentTenantId());
    }

    public PerformanceReview getReview(String reviewId) {
        return reviewRepo.findByReviewIdAndTenantIdAndIsDeletedFalse(reviewId, getCurrentTenantId())
                .orElseThrow(() -> new RuntimeException("Review not found"));
    }

    public PerformanceReview submitReview(String reviewId, String userId) {
        PerformanceReview review = getReview(reviewId);
        if (review.getRatings() != null && !review.getRatings().isEmpty()) {
            double avg = review.getRatings().stream().filter(r -> r.getScore() != null)
                    .mapToInt(r -> r.getScore()).average().orElse(0.0);
            review.setOverallScore(avg);
        }
        review.setStatus(ReviewStatus.SUBMITTED);
        review.setUpdatedAt(LocalDateTime.now()); review.setUpdatedBy(userId);
        return reviewRepo.save(review);
    }

    public PerformanceReview acknowledgeReview(String reviewId, String userId) {
        PerformanceReview review = getReview(reviewId);
        review.setStatus(ReviewStatus.ACKNOWLEDGED);
        review.setUpdatedAt(LocalDateTime.now()); review.setUpdatedBy(userId);
        return reviewRepo.save(review);
    }
}
