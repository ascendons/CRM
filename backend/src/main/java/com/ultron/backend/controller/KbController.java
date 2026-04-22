package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.KbCategory;
import com.ultron.backend.dto.request.CreateKbArticleRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.KbArticleResponse;
import com.ultron.backend.service.KbService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/kb")
@RequiredArgsConstructor
@Slf4j
public class KbController {

    private final KbService kbService;

    // ===== CATEGORIES =====

    @GetMapping("/categories")
    @PreAuthorize("hasPermission('KNOWLEDGE_BASE', 'VIEW')")
    public ResponseEntity<ApiResponse<List<KbCategory>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success("Categories retrieved", kbService.getAllCategories()));
    }

    @PostMapping("/categories")
    @PreAuthorize("hasPermission('KNOWLEDGE_BASE', 'CREATE')")
    public ResponseEntity<ApiResponse<KbCategory>> createCategory(@RequestBody Map<String, Object> body) {
        String userId = getCurrentUserId();
        String name = (String) body.get("name");
        String description = (String) body.get("description");
        String parentCategoryId = (String) body.get("parentCategoryId");
        String icon = (String) body.get("icon");
        Integer sortOrder = body.get("sortOrder") != null ? (Integer) body.get("sortOrder") : 0;
        KbCategory category = kbService.createCategory(name, description, parentCategoryId, icon, sortOrder, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Category created", category));
    }

    // ===== ARTICLES =====

    @GetMapping("/articles")
    @PreAuthorize("hasPermission('KNOWLEDGE_BASE', 'VIEW')")
    public ResponseEntity<ApiResponse<List<KbArticleResponse>>> getArticles(
            @RequestParam(required = false) String categoryId) {
        List<KbArticleResponse> articles = categoryId != null
                ? kbService.getArticlesByCategory(categoryId)
                : kbService.getPublishedArticles();
        return ResponseEntity.ok(ApiResponse.success("Articles retrieved", articles));
    }

    @GetMapping("/articles/all")
    @PreAuthorize("hasPermission('KNOWLEDGE_BASE', 'EDIT')")
    public ResponseEntity<ApiResponse<List<KbArticleResponse>>> getAllArticles() {
        return ResponseEntity.ok(ApiResponse.success("Articles retrieved", kbService.getAllArticles()));
    }

    @GetMapping("/articles/{articleId}")
    @PreAuthorize("hasPermission('KNOWLEDGE_BASE', 'VIEW')")
    public ResponseEntity<ApiResponse<KbArticleResponse>> getArticleById(@PathVariable String articleId) {
        return ResponseEntity.ok(ApiResponse.success("Article retrieved", kbService.getArticleById(articleId)));
    }

    @PostMapping("/articles")
    @PreAuthorize("hasPermission('KNOWLEDGE_BASE', 'CREATE')")
    public ResponseEntity<ApiResponse<KbArticleResponse>> createArticle(@Valid @RequestBody CreateKbArticleRequest request) {
        String userId = getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Article created", kbService.createArticle(request, userId)));
    }

    @PutMapping("/articles/{articleId}")
    @PreAuthorize("hasPermission('KNOWLEDGE_BASE', 'EDIT')")
    public ResponseEntity<ApiResponse<KbArticleResponse>> updateArticle(
            @PathVariable String articleId,
            @RequestBody CreateKbArticleRequest request) {
        String userId = getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Article updated", kbService.updateArticle(articleId, request, userId)));
    }

    @PostMapping("/articles/{articleId}/publish")
    @PreAuthorize("hasPermission('KNOWLEDGE_BASE', 'PUBLISH')")
    public ResponseEntity<ApiResponse<KbArticleResponse>> publishArticle(@PathVariable String articleId) {
        String userId = getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Article published", kbService.publishArticle(articleId, userId)));
    }

    @PostMapping("/articles/{articleId}/archive")
    @PreAuthorize("hasPermission('KNOWLEDGE_BASE', 'EDIT')")
    public ResponseEntity<ApiResponse<KbArticleResponse>> archiveArticle(@PathVariable String articleId) {
        String userId = getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Article archived", kbService.archiveArticle(articleId, userId)));
    }

    @DeleteMapping("/articles/{articleId}")
    @PreAuthorize("hasPermission('KNOWLEDGE_BASE', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteArticle(@PathVariable String articleId) {
        kbService.deleteArticle(articleId);
        return ResponseEntity.ok(ApiResponse.success("Article deleted", null));
    }

    @GetMapping("/search")
    @PreAuthorize("hasPermission('KNOWLEDGE_BASE', 'VIEW')")
    public ResponseEntity<ApiResponse<List<KbArticleResponse>>> search(@RequestParam String q) {
        return ResponseEntity.ok(ApiResponse.success("Search results", kbService.searchArticles(q)));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }
}
