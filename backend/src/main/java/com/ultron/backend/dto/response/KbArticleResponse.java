package com.ultron.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.ultron.backend.domain.enums.KbArticleStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class KbArticleResponse {

    private String id;
    private String articleId;
    private String tenantId;
    private String categoryId;
    private String title;
    private String slug;
    private String body;
    private String authorId;
    private KbArticleStatus status;
    private List<String> tags;
    private Long viewCount;
    private List<String> searchKeywords;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
