package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.WebForm;
import com.ultron.backend.domain.entity.WebFormSubmission;
import com.ultron.backend.dto.request.CreateWebFormRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.service.WebFormService;
import jakarta.servlet.http.HttpServletRequest;
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
@RequestMapping("/forms")
@RequiredArgsConstructor
@Slf4j
public class WebFormController {

    private final WebFormService webFormService;

    @GetMapping
    @PreAuthorize("hasPermission('WEB_FORMS', 'VIEW')")
    public ResponseEntity<ApiResponse<List<WebForm>>> getForms() {
        return ResponseEntity.ok(ApiResponse.success("Forms retrieved", webFormService.getAllForms()));
    }

    @PostMapping
    @PreAuthorize("hasPermission('WEB_FORMS', 'CREATE')")
    public ResponseEntity<ApiResponse<WebForm>> createForm(@Valid @RequestBody CreateWebFormRequest request) {
        String userId = getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Form created", webFormService.createForm(request, userId)));
    }

    @GetMapping("/{formId}")
    @PreAuthorize("hasPermission('WEB_FORMS', 'VIEW')")
    public ResponseEntity<ApiResponse<WebForm>> getFormById(@PathVariable String formId) {
        return ResponseEntity.ok(ApiResponse.success("Form retrieved", webFormService.getFormById(formId)));
    }

    @PutMapping("/{formId}")
    @PreAuthorize("hasPermission('WEB_FORMS', 'EDIT')")
    public ResponseEntity<ApiResponse<WebForm>> updateForm(
            @PathVariable String formId,
            @RequestBody CreateWebFormRequest request) {
        String userId = getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Form updated", webFormService.updateForm(formId, request, userId)));
    }

    @DeleteMapping("/{formId}")
    @PreAuthorize("hasPermission('WEB_FORMS', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteForm(@PathVariable String formId) {
        webFormService.deleteForm(formId);
        return ResponseEntity.ok(ApiResponse.success("Form deleted", null));
    }

    @PostMapping("/{formId}/submit")
    public ResponseEntity<ApiResponse<WebFormSubmission>> submitForm(
            @PathVariable String formId,
            @RequestBody Map<String, String> responses,
            HttpServletRequest httpRequest) {
        String ipAddress = httpRequest.getRemoteAddr();
        WebFormSubmission submission = webFormService.submitForm(formId, responses, ipAddress);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Form submitted successfully", submission));
    }

    @GetMapping("/{formId}/submissions")
    @PreAuthorize("hasPermission('WEB_FORMS', 'VIEW')")
    public ResponseEntity<ApiResponse<List<WebFormSubmission>>> getSubmissions(@PathVariable String formId) {
        return ResponseEntity.ok(ApiResponse.success("Submissions retrieved", webFormService.getSubmissions(formId)));
    }

    @GetMapping("/{formId}/embed-code")
    @PreAuthorize("hasPermission('WEB_FORMS', 'VIEW')")
    public ResponseEntity<ApiResponse<String>> getEmbedCode(@PathVariable String formId) {
        return ResponseEntity.ok(ApiResponse.success("Embed code generated", webFormService.getEmbedCode(formId)));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }
}
