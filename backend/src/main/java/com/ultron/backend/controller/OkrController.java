package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.Objective;
import com.ultron.backend.dto.performance.CreateObjectiveRequest;
import com.ultron.backend.dto.performance.UpdateKeyResultRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.service.OkrService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController @RequestMapping("/hr/okrs") @RequiredArgsConstructor
public class OkrController {
    private final OkrService okrService;

    private String currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }

    @GetMapping
    @PreAuthorize("hasPermission('PERFORMANCE_REVIEWS', 'VIEW')")
    public ResponseEntity<ApiResponse<List<Objective>>> getObjectives() {
        return ResponseEntity.ok(ApiResponse.<List<Objective>>builder().success(true).data(okrService.getObjectives()).build());
    }

    @PostMapping
    @PreAuthorize("hasPermission('PERFORMANCE_REVIEWS', 'CREATE')")
    public ResponseEntity<ApiResponse<Objective>> createObjective(@RequestBody CreateObjectiveRequest req) {
        return ResponseEntity.ok(ApiResponse.<Objective>builder().success(true).data(okrService.createObjective(req, currentUserId())).build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('PERFORMANCE_REVIEWS', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteObjective(@PathVariable String id) {
        okrService.deleteObjective(id, currentUserId());
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Deleted").build());
    }

    @PutMapping("/{id}/key-results/{krIndex}")
    @PreAuthorize("hasPermission('PERFORMANCE_REVIEWS', 'EDIT')")
    public ResponseEntity<ApiResponse<Objective>> updateKr(@PathVariable String id, @PathVariable int krIndex, @RequestBody UpdateKeyResultRequest req) {
        return ResponseEntity.ok(ApiResponse.<Objective>builder().success(true).data(okrService.updateKeyResult(id, krIndex, req, currentUserId())).build());
    }
}
