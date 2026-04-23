package com.ultron.backend.service;

import com.ultron.backend.domain.entity.KbArticle;
import com.ultron.backend.domain.entity.KbCategory;
import com.ultron.backend.domain.enums.KbArticleStatus;
import com.ultron.backend.dto.request.CreateKbArticleRequest;
import com.ultron.backend.dto.response.KbArticleResponse;
import com.ultron.backend.repository.KbArticleRepository;
import com.ultron.backend.repository.KbCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class KbService extends BaseTenantService {

    private final KbArticleRepository articleRepository;
    private final KbCategoryRepository categoryRepository;
    private final KbArticleIdGeneratorService idGeneratorService;

    // ===== CATEGORY METHODS =====

    public KbCategory createCategory(String name, String description, String parentCategoryId, String icon, Integer sortOrder, String createdByUserId) {
        String tenantId = getCurrentTenantId();

        KbCategory category = KbCategory.builder()
                .categoryId(idGeneratorService.generateCategoryId())
                .tenantId(tenantId)
                .name(name)
                .description(description)
                .parentCategoryId(parentCategoryId)
                .icon(icon)
                .sortOrder(sortOrder)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(createdByUserId)
                .updatedAt(LocalDateTime.now())
                .updatedBy(createdByUserId)
                .build();

        return categoryRepository.save(category);
    }

    public List<KbCategory> getAllCategories() {
        String tenantId = getCurrentTenantId();
        return categoryRepository.findByTenantIdAndIsDeletedFalse(tenantId);
    }

    // ===== ARTICLE METHODS =====

    public KbArticleResponse createArticle(CreateKbArticleRequest request, String createdByUserId) {
        String tenantId = getCurrentTenantId();

        String slug = generateSlug(request.getTitle());

        KbArticle article = KbArticle.builder()
                .articleId(idGeneratorService.generateArticleId())
                .tenantId(tenantId)
                .categoryId(request.getCategoryId())
                .title(request.getTitle())
                .slug(slug)
                .body(request.getBody())
                .authorId(createdByUserId)
                .status(request.getStatus() != null ? request.getStatus() : KbArticleStatus.DRAFT)
                .tags(request.getTags())
                .viewCount(0L)
                .searchKeywords(request.getSearchKeywords())
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(createdByUserId)
                .updatedAt(LocalDateTime.now())
                .updatedBy(createdByUserId)
                .build();

        return toResponse(articleRepository.save(article));
    }

    public List<KbArticleResponse> getAllArticles() {
        String tenantId = getCurrentTenantId();
        return articleRepository.findByTenantIdAndIsDeletedFalse(tenantId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<KbArticleResponse> getPublishedArticles() {
        String tenantId = getCurrentTenantId();
        return articleRepository.findByTenantIdAndStatusAndIsDeletedFalse(tenantId, KbArticleStatus.PUBLISHED)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<KbArticleResponse> getArticlesByCategory(String categoryId) {
        String tenantId = getCurrentTenantId();
        return articleRepository.findByTenantIdAndCategoryIdAndIsDeletedFalse(tenantId, categoryId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public KbArticleResponse getArticleById(String articleId) {
        String tenantId = getCurrentTenantId();
        KbArticle article = articleRepository.findByArticleIdAndTenantId(articleId, tenantId)
                .orElseThrow(() -> new RuntimeException("Article not found: " + articleId));
        // Increment view count
        article.setViewCount(article.getViewCount() != null ? article.getViewCount() + 1 : 1L);
        articleRepository.save(article);
        return toResponse(article);
    }

    public KbArticleResponse updateArticle(String articleId, CreateKbArticleRequest request, String updatedByUserId) {
        String tenantId = getCurrentTenantId();
        KbArticle article = articleRepository.findByArticleIdAndTenantId(articleId, tenantId)
                .orElseThrow(() -> new RuntimeException("Article not found: " + articleId));

        if (request.getTitle() != null) {
            article.setTitle(request.getTitle());
            article.setSlug(generateSlug(request.getTitle()));
        }
        if (request.getCategoryId() != null) article.setCategoryId(request.getCategoryId());
        if (request.getBody() != null) article.setBody(request.getBody());
        if (request.getStatus() != null) article.setStatus(request.getStatus());
        if (request.getTags() != null) article.setTags(request.getTags());
        if (request.getSearchKeywords() != null) article.setSearchKeywords(request.getSearchKeywords());

        article.setUpdatedAt(LocalDateTime.now());
        article.setUpdatedBy(updatedByUserId);

        return toResponse(articleRepository.save(article));
    }

    public KbArticleResponse publishArticle(String articleId, String updatedByUserId) {
        String tenantId = getCurrentTenantId();
        KbArticle article = articleRepository.findByArticleIdAndTenantId(articleId, tenantId)
                .orElseThrow(() -> new RuntimeException("Article not found: " + articleId));

        article.setStatus(KbArticleStatus.PUBLISHED);
        article.setPublishedAt(LocalDateTime.now());
        article.setUpdatedAt(LocalDateTime.now());
        article.setUpdatedBy(updatedByUserId);

        return toResponse(articleRepository.save(article));
    }

    public KbArticleResponse archiveArticle(String articleId, String updatedByUserId) {
        String tenantId = getCurrentTenantId();
        KbArticle article = articleRepository.findByArticleIdAndTenantId(articleId, tenantId)
                .orElseThrow(() -> new RuntimeException("Article not found: " + articleId));

        article.setStatus(KbArticleStatus.ARCHIVED);
        article.setUpdatedAt(LocalDateTime.now());
        article.setUpdatedBy(updatedByUserId);

        return toResponse(articleRepository.save(article));
    }

    public List<KbArticleResponse> searchArticles(String query) {
        String tenantId = getCurrentTenantId();
        return articleRepository.searchByTenantId(query, tenantId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public void deleteArticle(String articleId) {
        String tenantId = getCurrentTenantId();
        KbArticle article = articleRepository.findByArticleIdAndTenantId(articleId, tenantId)
                .orElseThrow(() -> new RuntimeException("Article not found: " + articleId));
        article.setDeleted(true);
        article.setUpdatedAt(LocalDateTime.now());
        articleRepository.save(article);
    }

    private String generateSlug(String title) {
        String base = title.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-");
        return base + "-" + System.currentTimeMillis();
    }

    private KbArticleResponse toResponse(KbArticle article) {
        return KbArticleResponse.builder()
                .id(article.getId())
                .articleId(article.getArticleId())
                .tenantId(article.getTenantId())
                .categoryId(article.getCategoryId())
                .title(article.getTitle())
                .slug(article.getSlug())
                .body(article.getBody())
                .authorId(article.getAuthorId())
                .status(article.getStatus())
                .tags(article.getTags())
                .viewCount(article.getViewCount())
                .searchKeywords(article.getSearchKeywords())
                .publishedAt(article.getPublishedAt())
                .createdAt(article.getCreatedAt())
                .createdBy(article.getCreatedBy())
                .updatedAt(article.getUpdatedAt())
                .updatedBy(article.getUpdatedBy())
                .build();
    }
}
