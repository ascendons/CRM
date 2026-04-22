package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.FeedPost;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.service.FeedService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/feed") @RequiredArgsConstructor
public class FeedController {
    private final FeedService feedService;

    private String currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }

    @GetMapping
    @PreAuthorize("hasPermission('FEED', 'VIEW')")
    public ResponseEntity<ApiResponse<Page<FeedPost>>> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.<Page<FeedPost>>builder().success(true).data(feedService.getFeed(page, size)).build());
    }

    @PostMapping
    @PreAuthorize("hasPermission('FEED', 'CREATE')")
    public ResponseEntity<ApiResponse<FeedPost>> createPost(@RequestBody FeedPost post) {
        return ResponseEntity.ok(ApiResponse.<FeedPost>builder().success(true).data(feedService.createPost(post, currentUserId())).build());
    }

    @PostMapping("/{id}/react")
    @PreAuthorize("hasPermission('FEED', 'VIEW')")
    public ResponseEntity<ApiResponse<FeedPost>> react(@PathVariable String id, @RequestBody ReactRequest req) {
        return ResponseEntity.ok(ApiResponse.<FeedPost>builder().success(true).data(feedService.react(id, req.getEmoji(), currentUserId())).build());
    }

    @PostMapping("/{id}/vote")
    @PreAuthorize("hasPermission('FEED', 'VIEW')")
    public ResponseEntity<ApiResponse<FeedPost>> vote(@PathVariable String id, @RequestBody VoteRequest req) {
        return ResponseEntity.ok(ApiResponse.<FeedPost>builder().success(true).data(feedService.vote(id, req.getOptionIndex(), currentUserId())).build());
    }

    @PutMapping("/{id}/pin")
    @PreAuthorize("hasPermission('FEED', 'PIN')")
    public ResponseEntity<ApiResponse<FeedPost>> pin(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.<FeedPost>builder().success(true).data(feedService.pin(id, currentUserId())).build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('FEED', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        feedService.deletePost(id, currentUserId());
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Deleted").build());
    }

    @Data static class ReactRequest { private String emoji; }
    @Data static class VoteRequest { private Integer optionIndex; }
}
