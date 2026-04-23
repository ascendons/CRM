package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.Survey;
import com.ultron.backend.domain.entity.SurveyResponse;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.service.SurveyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/surveys")
@RequiredArgsConstructor
public class SurveyController {

    private final SurveyService surveyService;

    @GetMapping
    @PreAuthorize("hasPermission('SURVEYS', 'VIEW')")
    public ResponseEntity<ApiResponse<List<Survey>>> getAll() {
        return ResponseEntity.ok(ApiResponse.<List<Survey>>builder()
                .success(true).data(surveyService.getAll()).build());
    }

    @PostMapping
    @PreAuthorize("hasPermission('SURVEYS', 'CREATE')")
    public ResponseEntity<ApiResponse<Survey>> create(@RequestBody Survey survey) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<Survey>builder()
                .success(true).data(surveyService.createSurvey(survey)).build());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('SURVEYS', 'VIEW')")
    public ResponseEntity<ApiResponse<Survey>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.<Survey>builder()
                .success(true).data(surveyService.getById(id)).build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('SURVEYS', 'EDIT')")
    public ResponseEntity<ApiResponse<Survey>> update(@PathVariable String id, @RequestBody Survey survey) {
        return ResponseEntity.ok(ApiResponse.<Survey>builder()
                .success(true).data(surveyService.updateSurvey(id, survey)).build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('SURVEYS', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        surveyService.deleteSurvey(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Deleted").build());
    }

    @PostMapping("/{id}/respond")
    @PreAuthorize("hasPermission('SURVEYS', 'VIEW')")
    public ResponseEntity<ApiResponse<SurveyResponse>> respond(
            @PathVariable String id,
            @RequestBody List<SurveyResponse.Answer> answers,
            @RequestParam(defaultValue = "false") boolean anonymous) {
        return ResponseEntity.ok(ApiResponse.<SurveyResponse>builder()
                .success(true).data(surveyService.submitResponse(id, answers, anonymous)).build());
    }

    @GetMapping("/{id}/results")
    @PreAuthorize("hasPermission('SURVEYS', 'VIEW')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getResults(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true).data(surveyService.getResults(id)).build());
    }
}
