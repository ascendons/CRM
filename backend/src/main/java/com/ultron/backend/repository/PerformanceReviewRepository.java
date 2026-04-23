package com.ultron.backend.repository;
import com.ultron.backend.domain.entity.PerformanceReview;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;
public interface PerformanceReviewRepository extends MongoRepository<PerformanceReview, String> {
    List<PerformanceReview> findByTenantIdAndIsDeletedFalse(String tenantId);
    List<PerformanceReview> findByCycleIdAndTenantIdAndIsDeletedFalse(String cycleId, String tenantId);
    Optional<PerformanceReview> findByReviewIdAndTenantIdAndIsDeletedFalse(String reviewId, String tenantId);
}
