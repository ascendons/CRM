package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.KbArticleStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "kb_articles")
public class KbArticle {

    @Id
    private String id;

    @Indexed(unique = true)
    private String articleId;

    @Indexed
    private String tenantId;

    private String categoryId;
    private String title;

    @Indexed(unique = true)
    private String slug;

    private String body;
    private String authorId;
    private KbArticleStatus status;
    private List<String> tags;
    private Long viewCount;
    private List<String> searchKeywords;
    private LocalDateTime publishedAt;

    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
