package com.ultron.backend.domain.entity;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
@Document(collection = "feed_reactions")
public class FeedReaction {
    @Id private String id;
    @Indexed private String tenantId;
    private String postId;
    private String userId;
    private String emoji;
    private LocalDateTime createdAt;
}
