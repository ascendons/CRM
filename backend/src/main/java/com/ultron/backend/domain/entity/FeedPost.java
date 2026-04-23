package com.ultron.backend.domain.entity;
import com.ultron.backend.domain.enums.FeedPostType;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
@Document(collection = "feed_posts")
public class FeedPost {
    @Id private String id;
    @Indexed(unique = true) private String postId;
    @Indexed private String tenantId;
    private FeedPostType type;
    private String authorId;
    private String body;
    private String imageUrl;
    private List<PollOption> pollOptions;
    private boolean isPinned;
    private List<String> mentions;
    private Map<String, Integer> reactionCounts;
    private Integer commentCount;
    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PollOption {
        private String option;
        private Integer voteCount;
    }
}
