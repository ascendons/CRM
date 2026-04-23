package com.ultron.backend.controller;

import com.ultron.backend.dto.request.CreateTimeEntryRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.TimeEntryResponse;
import com.ultron.backend.dto.response.WorkloadSummary;
import com.ultron.backend.service.TimeEntryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/time-entries")
@RequiredArgsConstructor
@Slf4j
public class TimeEntryController {

    private final TimeEntryService timeEntryService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TimeEntryResponse>> createEntry(@RequestBody CreateTimeEntryRequest request) {
        String userId = getCurrentUserId();
        TimeEntryResponse entry = timeEntryService.createEntry(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Time entry created", entry));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<TimeEntryResponse>>> getEntries(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        String currentUserId = userId != null ? userId : getCurrentUserId();
        List<TimeEntryResponse> entries = timeEntryService.getEntriesByUser(currentUserId, from, to);
        return ResponseEntity.ok(ApiResponse.success("Time entries retrieved", entries));
    }

    @GetMapping("/workload")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<WorkloadSummary>>> getWorkload(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate effectiveDate = date != null ? date : LocalDate.now();
        List<WorkloadSummary> summary = timeEntryService.getWorkloadSummary(effectiveDate);
        return ResponseEntity.ok(ApiResponse.success("Workload summary retrieved", summary));
    }

    @PostMapping("/{entryId}/stop")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TimeEntryResponse>> stopTimer(@PathVariable String entryId) {
        String userId = getCurrentUserId();
        TimeEntryResponse entry = timeEntryService.stopTimer(entryId, userId);
        return ResponseEntity.ok(ApiResponse.success("Timer stopped", entry));
    }

    @PostMapping("/start")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TimeEntryResponse>> startTimer(@RequestBody Map<String, String> body) {
        String userId = getCurrentUserId();
        String taskId = body.get("taskId");
        String projectId = body.get("projectId");
        TimeEntryResponse entry = timeEntryService.startTimer(taskId, projectId, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Timer started", entry));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }
}
