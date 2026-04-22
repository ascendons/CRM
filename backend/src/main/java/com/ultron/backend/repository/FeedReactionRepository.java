package com.ultron.backend.repository;
import com.ultron.backend.domain.entity.FeedReaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;
public interface FeedReactionRepository extends MongoRepository<FeedReaction, String> {
    Optional<FeedReaction> findByTenantIdAndPostIdAndUserIdAndEmoji(String tenantId, String postId, String userId, String emoji);
}
