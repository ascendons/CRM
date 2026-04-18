package com.ultron.backend.controller;

import com.ultron.backend.dto.request.CreateTechnicianSkillRequest;
import com.ultron.backend.dto.request.CreateTrainingRecordRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.TechnicianSkillResponse;
import com.ultron.backend.dto.response.TrainingRecordResponse;
import com.ultron.backend.service.SkillMatrixService;
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
@RequestMapping("/skill-matrix")
@RequiredArgsConstructor
@Slf4j
public class SkillMatrixController {

    private final SkillMatrixService skillMatrixService;

    @PostMapping("/skills")
    @PreAuthorize("hasPermission('SKILL_MATRIX', 'EDIT')")
    public ResponseEntity<ApiResponse<TechnicianSkillResponse>> addSkill(
            @Valid @RequestBody CreateTechnicianSkillRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Skill added", skillMatrixService.addSkill(request, getCurrentUserId())));
    }

    @GetMapping("/skills/user/{userId}")
    @PreAuthorize("hasPermission('SKILL_MATRIX', 'VIEW')")
    public ResponseEntity<ApiResponse<List<TechnicianSkillResponse>>> getSkillsByUser(
            @PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.success("Skills retrieved",
                skillMatrixService.getSkillsByUser(userId)));
    }

    @GetMapping("/skills/by-skill")
    @PreAuthorize("hasPermission('SKILL_MATRIX', 'VIEW')")
    public ResponseEntity<ApiResponse<List<TechnicianSkillResponse>>> getBySkillName(
            @RequestParam String skillName) {
        return ResponseEntity.ok(ApiResponse.success("Engineers with skill retrieved",
                skillMatrixService.getBySkillName(skillName)));
    }

    @GetMapping("/skills/expiring")
    @PreAuthorize("hasPermission('SKILL_MATRIX', 'VIEW')")
    public ResponseEntity<ApiResponse<List<TechnicianSkillResponse>>> getExpiringCertifications(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(ApiResponse.success("Expiring certifications retrieved",
                skillMatrixService.getExpiringCertifications(days)));
    }

    @DeleteMapping("/skills/{id}")
    @PreAuthorize("hasPermission('SKILL_MATRIX', 'EDIT')")
    public ResponseEntity<ApiResponse<Void>> deleteSkill(@PathVariable String id) {
        skillMatrixService.deleteSkill(id, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Skill deleted", null));
    }

    @PostMapping("/training")
    @PreAuthorize("hasPermission('SKILL_MATRIX', 'EDIT')")
    public ResponseEntity<ApiResponse<TrainingRecordResponse>> addTraining(
            @Valid @RequestBody CreateTrainingRecordRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Training record added",
                        skillMatrixService.addTraining(request, getCurrentUserId())));
    }

    @GetMapping("/training/user/{userId}")
    @PreAuthorize("hasPermission('SKILL_MATRIX', 'VIEW')")
    public ResponseEntity<ApiResponse<List<TrainingRecordResponse>>> getTrainingByUser(
            @PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.success("Training records retrieved",
                skillMatrixService.getTrainingByUser(userId)));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : null;
    }
}
