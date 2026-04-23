package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.LandingPage;
import com.ultron.backend.dto.request.CreateLandingPageRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.service.LandingPageService;
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

@RestController
@RequestMapping("/landing-pages")
@RequiredArgsConstructor
@Slf4j
public class LandingPageController {

    private final LandingPageService landingPageService;

    @GetMapping
    @PreAuthorize("hasPermission('WEB_FORMS', 'VIEW')")
    public ResponseEntity<ApiResponse<List<LandingPage>>> getPages() {
        return ResponseEntity.ok(ApiResponse.success("Pages retrieved", landingPageService.getAllPages()));
    }

    @PostMapping
    @PreAuthorize("hasPermission('WEB_FORMS', 'CREATE')")
    public ResponseEntity<ApiResponse<LandingPage>> createPage(@Valid @RequestBody CreateLandingPageRequest request) {
        String userId = getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Landing page created", landingPageService.createLandingPage(request, userId)));
    }

    @GetMapping("/{pageId}")
    @PreAuthorize("hasPermission('WEB_FORMS', 'VIEW')")
    public ResponseEntity<ApiResponse<LandingPage>> getPageById(@PathVariable String pageId) {
        return ResponseEntity.ok(ApiResponse.success("Page retrieved", landingPageService.getPageById(pageId)));
    }

    @GetMapping("/public/{slug}")
    public ResponseEntity<ApiResponse<LandingPage>> getPageBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.success("Page retrieved", landingPageService.getPageBySlug(slug)));
    }

    @PostMapping("/{pageId}/publish")
    @PreAuthorize("hasPermission('WEB_FORMS', 'EDIT')")
    public ResponseEntity<ApiResponse<LandingPage>> publishPage(@PathVariable String pageId) {
        String userId = getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Page published", landingPageService.publishPage(pageId, userId)));
    }

    @PostMapping("/{pageId}/unpublish")
    @PreAuthorize("hasPermission('WEB_FORMS', 'EDIT')")
    public ResponseEntity<ApiResponse<LandingPage>> unpublishPage(@PathVariable String pageId) {
        String userId = getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Page unpublished", landingPageService.unpublishPage(pageId, userId)));
    }

    @DeleteMapping("/{pageId}")
    @PreAuthorize("hasPermission('WEB_FORMS', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> deletePage(@PathVariable String pageId) {
        landingPageService.deletePage(pageId);
        return ResponseEntity.ok(ApiResponse.success("Page deleted", null));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }
}
