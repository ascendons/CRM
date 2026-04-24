package com.ultron.backend.controller;

import com.ultron.backend.domain.enums.TermsType;
import com.ultron.backend.dto.request.CreateTermsTemplateRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.TermsTemplateResponse;
import com.ultron.backend.service.TermsTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/terms-templates")
@RequiredArgsConstructor
@Slf4j
public class TermsTemplateController {

    private final TermsTemplateService termsTemplateService;

    /**
     * GET /api/v1/terms-templates
     * GET /api/v1/terms-templates?type=PAYMENT_TERMS
     * Any authenticated user can read templates.
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<TermsTemplateResponse>>> getTemplates(
            @RequestParam(required = false) TermsType type) {

        List<TermsTemplateResponse> templates = (type != null)
                ? termsTemplateService.getByType(type)
                : termsTemplateService.getAll();

        return ResponseEntity.ok(ApiResponse.<List<TermsTemplateResponse>>builder()
                .success(true)
                .message("Terms templates retrieved successfully")
                .data(templates)
                .build());
    }

    /**
     * POST /api/v1/terms-templates
     * Admin only.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TermsTemplateResponse>> createTemplate(
            @Valid @RequestBody CreateTermsTemplateRequest request) {

        log.info("Admin creating terms template: {} (type={})", request.getName(), request.getType());
        TermsTemplateResponse response = termsTemplateService.create(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<TermsTemplateResponse>builder()
                        .success(true)
                        .message("Terms template created successfully")
                        .data(response)
                        .build());
    }

    /**
     * PUT /api/v1/terms-templates/{id}
     * Admin only.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TermsTemplateResponse>> updateTemplate(
            @PathVariable String id,
            @Valid @RequestBody CreateTermsTemplateRequest request) {

        log.info("Admin updating terms template: {}", id);
        TermsTemplateResponse response = termsTemplateService.update(id, request);

        return ResponseEntity.ok(ApiResponse.<TermsTemplateResponse>builder()
                .success(true)
                .message("Terms template updated successfully")
                .data(response)
                .build());
    }

    /**
     * DELETE /api/v1/terms-templates/{id}
     * Admin only. Soft delete.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable String id) {
        log.info("Admin soft-deleting terms template: {}", id);
        termsTemplateService.delete(id);

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Terms template deleted successfully")
                .build());
    }
}
