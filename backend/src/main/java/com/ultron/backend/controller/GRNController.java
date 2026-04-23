package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.GRN;
import com.ultron.backend.dto.request.CreateGRNRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.service.GRNService;
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
@RequestMapping("/procurement/grn")
@RequiredArgsConstructor
@Slf4j
public class GRNController {

    private final GRNService grnService;

    @PostMapping
    @PreAuthorize("hasPermission('PROCUREMENT', 'RECEIVE')")
    public ResponseEntity<ApiResponse<GRN>> create(@Valid @RequestBody CreateGRNRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("GRN created", grnService.create(request, getCurrentUserId())));
    }

    @GetMapping
    @PreAuthorize("hasPermission('PROCUREMENT', 'READ')")
    public ResponseEntity<ApiResponse<List<GRN>>> getAll(
            @RequestParam(required = false) String poId) {
        List<GRN> result = poId != null ? grnService.getByPO(poId) : grnService.getAll();
        return ResponseEntity.ok(ApiResponse.success("GRNs retrieved", result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('PROCUREMENT', 'READ')")
    public ResponseEntity<ApiResponse<GRN>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("GRN retrieved", grnService.getById(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('PROCUREMENT', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        grnService.delete(id, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("GRN deleted", null));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : null;
    }
}
