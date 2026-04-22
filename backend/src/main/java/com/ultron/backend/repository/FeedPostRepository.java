package com.ultron.backend.repository;
import com.ultron.backend.domain.entity.FeedPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;
public interface FeedPostRepository extends MongoRepository<FeedPost, String> {
    Page<FeedPost> findByTenantIdAndIsDeletedFalseOrderByIsPinnedDescCreatedAtDesc(String tenantId, Pageable pageable);
    Optional<FeedPost> findByPostIdAndTenantIdAndIsDeletedFalse(String postId, String tenantId);
}
