package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.OnboardingInstance;
import com.ultron.backend.domain.entity.OnboardingTemplate;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.service.OnboardingService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController @RequestMapping("/hr/onboarding") @RequiredArgsConstructor
public class OnboardingController {
    private final OnboardingService onboardingService;

    private String currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }

    @GetMapping("/templates")
    @PreAuthorize("hasPermission('ONBOARDING', 'VIEW')")
    public ResponseEntity<ApiResponse<List<OnboardingTemplate>>> getTemplates() {
        return ResponseEntity.ok(ApiResponse.<List<OnboardingTemplate>>builder().success(true).data(onboardingService.getTemplates()).build());
    }

    @PostMapping("/templates")
    @PreAuthorize("hasPermission('ONBOARDING', 'CREATE')")
    public ResponseEntity<ApiResponse<OnboardingTemplate>> createTemplate(@RequestBody OnboardingTemplate template) {
        return ResponseEntity.ok(ApiResponse.<OnboardingTemplate>builder().success(true).data(onboardingService.createTemplate(template, currentUserId())).build());
    }

    @GetMapping("/templates/{id}")
    @PreAuthorize("hasPermission('ONBOARDING', 'VIEW')")
    public ResponseEntity<ApiResponse<OnboardingTemplate>> getTemplate(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.<OnboardingTemplate>builder().success(true).data(onboardingService.getTemplate(id)).build());
    }

    @DeleteMapping("/templates/{id}")
    @PreAuthorize("hasPermission('ONBOARDING', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable String id) {
        onboardingService.deleteTemplate(id, currentUserId());
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Deleted").build());
    }

    @GetMapping("/instances")
    @PreAuthorize("hasPermission('ONBOARDING', 'VIEW')")
    public ResponseEntity<ApiResponse<List<OnboardingInstance>>> getInstances() {
        return ResponseEntity.ok(ApiResponse.<List<OnboardingInstance>>builder().success(true).data(onboardingService.getInstances()).build());
    }

    @PostMapping("/instances")
    @PreAuthorize("hasPermission('ONBOARDING', 'CREATE')")
    public ResponseEntity<ApiResponse<OnboardingInstance>> createInstance(@RequestBody CreateInstanceRequest req) {
        return ResponseEntity.ok(ApiResponse.<OnboardingInstance>builder().success(true)
                .data(onboardingService.createInstance(req.getTemplateId(), req.getEmployeeId(), req.getStartDate(), req.getMentorId(), currentUserId())).build());
    }

    @PostMapping("/instances/{id}/tasks/{taskIndex}/complete")
    @PreAuthorize("hasPermission('ONBOARDING', 'EDIT')")
    public ResponseEntity<ApiResponse<OnboardingInstance>> completeTask(@PathVariable String id, @PathVariable int taskIndex) {
        return ResponseEntity.ok(ApiResponse.<OnboardingInstance>builder().success(true).data(onboardingService.completeTask(id, taskIndex, currentUserId())).build());
    }

    @GetMapping("/instances/{employeeId}")
    @PreAuthorize("hasPermission('ONBOARDING', 'VIEW')")
    public ResponseEntity<ApiResponse<List<OnboardingInstance>>> getByEmployee(@PathVariable String employeeId) {
        return ResponseEntity.ok(ApiResponse.<List<OnboardingInstance>>builder().success(true).data(onboardingService.getInstancesByEmployee(employeeId)).build());
    }

    @Data
    public static class CreateInstanceRequest {
        private String templateId;
        private String employeeId;
        private LocalDate startDate;
        private String mentorId;
    }
}
