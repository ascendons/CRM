package com.ultron.backend.repository;
import com.ultron.backend.domain.entity.FeedPollVote;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;
public interface FeedPollVoteRepository extends MongoRepository<FeedPollVote, String> {
    Optional<FeedPollVote> findByTenantIdAndPostIdAndUserId(String tenantId, String postId, String userId);
}
