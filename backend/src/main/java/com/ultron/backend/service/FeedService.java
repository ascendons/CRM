package com.ultron.backend.service;

import com.ultron.backend.domain.entity.FeedPost;
import com.ultron.backend.domain.entity.FeedPollVote;
import com.ultron.backend.domain.entity.FeedReaction;
import com.ultron.backend.domain.enums.FeedPostType;
import com.ultron.backend.repository.FeedPollVoteRepository;
import com.ultron.backend.repository.FeedPostRepository;
import com.ultron.backend.repository.FeedReactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor @Slf4j
public class FeedService extends BaseTenantService {
    private final FeedPostRepository postRepo;
    private final FeedReactionRepository reactionRepo;
    private final FeedPollVoteRepository voteRepo;

    public Page<FeedPost> getFeed(int page, int size) {
        return postRepo.findByTenantIdAndIsDeletedFalseOrderByIsPinnedDescCreatedAtDesc(getCurrentTenantId(), PageRequest.of(page, size));
    }

    public FeedPost createPost(FeedPost post, String userId) {
        String tenantId = getCurrentTenantId();
        post.setPostId("POST-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        post.setTenantId(tenantId); post.setAuthorId(userId);
        post.setReactionCounts(new HashMap<>()); post.setCommentCount(0);
        if (post.getType() == FeedPostType.POLL && post.getPollOptions() != null) {
            post.getPollOptions().forEach(o -> o.setVoteCount(0));
        }
        post.setDeleted(false); post.setCreatedAt(LocalDateTime.now()); post.setCreatedBy(userId);
        post.setUpdatedAt(LocalDateTime.now()); post.setUpdatedBy(userId);
        return postRepo.save(post);
    }

    public FeedPost react(String postId, String emoji, String userId) {
        String tenantId = getCurrentTenantId();
        FeedPost post = postRepo.findByPostIdAndTenantIdAndIsDeletedFalse(postId, tenantId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        Optional<FeedReaction> existing = reactionRepo.findByTenantIdAndPostIdAndUserIdAndEmoji(tenantId, postId, userId, emoji);
        if (existing.isPresent()) {
            reactionRepo.delete(existing.get());
            post.getReactionCounts().merge(emoji, -1, Integer::sum);
        } else {
            FeedReaction reaction = FeedReaction.builder().tenantId(tenantId).postId(postId).userId(userId).emoji(emoji).createdAt(LocalDateTime.now()).build();
            reactionRepo.save(reaction);
            post.getReactionCounts().merge(emoji, 1, Integer::sum);
        }
        return postRepo.save(post);
    }

    public FeedPost vote(String postId, int optionIndex, String userId) {
        String tenantId = getCurrentTenantId();
        FeedPost post = postRepo.findByPostIdAndTenantIdAndIsDeletedFalse(postId, tenantId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        if (voteRepo.findByTenantIdAndPostIdAndUserId(tenantId, postId, userId).isPresent())
            throw new RuntimeException("Already voted");
        voteRepo.save(FeedPollVote.builder().tenantId(tenantId).postId(postId).userId(userId).optionIndex(optionIndex).createdAt(LocalDateTime.now()).build());
        if (post.getPollOptions() != null && optionIndex < post.getPollOptions().size()) {
            FeedPost.PollOption opt = post.getPollOptions().get(optionIndex);
            opt.setVoteCount((opt.getVoteCount() != null ? opt.getVoteCount() : 0) + 1);
        }
        return postRepo.save(post);
    }

    public FeedPost pin(String postId, String userId) {
        FeedPost post = postRepo.findByPostIdAndTenantIdAndIsDeletedFalse(postId, getCurrentTenantId())
                .orElseThrow(() -> new RuntimeException("Post not found"));
        post.setPinned(!post.isPinned());
        post.setUpdatedAt(LocalDateTime.now()); post.setUpdatedBy(userId);
        return postRepo.save(post);
    }

    public void deletePost(String postId, String userId) {
        FeedPost post = postRepo.findByPostIdAndTenantIdAndIsDeletedFalse(postId, getCurrentTenantId())
                .orElseThrow(() -> new RuntimeException("Post not found"));
        post.setDeleted(true); post.setUpdatedAt(LocalDateTime.now()); post.setUpdatedBy(userId);
        postRepo.save(post);
    }
}
