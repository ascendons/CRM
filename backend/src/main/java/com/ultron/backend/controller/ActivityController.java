package com.ultron.backend.controller;

import com.ultron.backend.domain.enums.ActivityType;
import com.ultron.backend.domain.enums.ActivityStatus;
import com.ultron.backend.domain.enums.ActivityPriority;
import com.ultron.backend.dto.request.CreateActivityRequest;
import com.ultron.backend.dto.request.UpdateActivityRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.ActivityResponse;
import com.ultron.backend.dto.response.ActivityStatistics;
import com.ultron.backend.service.ActivityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/activities")
@RequiredArgsConstructor
@Slf4j
public class ActivityController {

    private final ActivityService activityService;

    @PostMapping
    public ResponseEntity<ApiResponse<ActivityResponse>> createActivity(
            @Valid @RequestBody CreateActivityRequest request) {

        String currentUserId = getCurrentUserId();
        log.info("User {} creating new activity: {}", currentUserId, request.getSubject());

        ActivityResponse activity = activityService.createActivity(request, currentUserId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.<ActivityResponse>builder()
                        .success(true)
                        .message("Activity created successfully")
                        .data(activity)
                        .build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ActivityResponse>>> getAllActivities() {
        log.info("Fetching all activities");
        List<ActivityResponse> activities = activityService.getAllActivities();

        return ResponseEntity.ok(
                ApiResponse.<List<ActivityResponse>>builder()
                        .success(true)
                        .message("Activities retrieved successfully")
                        .data(activities)
                        .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ActivityResponse>> getActivityById(@PathVariable String id) {
        log.info("Fetching activity with id: {}", id);
        ActivityResponse activity = activityService.getActivityById(id);

        return ResponseEntity.ok(
                ApiResponse.<ActivityResponse>builder()
                        .success(true)
                        .message("Activity retrieved successfully")
                        .data(activity)
                        .build());
    }

    @GetMapping("/code/{activityId}")
    public ResponseEntity<ApiResponse<ActivityResponse>> getActivityByActivityId(
            @PathVariable String activityId) {
        log.info("Fetching activity with activityId: {}", activityId);
        ActivityResponse activity = activityService.getActivityByActivityId(activityId);

        return ResponseEntity.ok(
                ApiResponse.<ActivityResponse>builder()
                        .success(true)
                        .message("Activity retrieved successfully")
                        .data(activity)
                        .build());
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<ApiResponse<List<ActivityResponse>>> getActivitiesByType(
            @PathVariable ActivityType type) {
        log.info("Fetching activities by type: {}", type);
        List<ActivityResponse> activities = activityService.getActivitiesByType(type);

        return ResponseEntity.ok(
                ApiResponse.<List<ActivityResponse>>builder()
                        .success(true)
                        .message("Activities retrieved successfully")
                        .data(activities)
                        .build());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<ActivityResponse>>> getActivitiesByStatus(
            @PathVariable ActivityStatus status) {
        log.info("Fetching activities by status: {}", status);
        List<ActivityResponse> activities = activityService.getActivitiesByStatus(status);

        return ResponseEntity.ok(
                ApiResponse.<List<ActivityResponse>>builder()
                        .success(true)
                        .message("Activities retrieved successfully")
                        .data(activities)
                        .build());
    }

    @GetMapping("/priority/{priority}")
    public ResponseEntity<ApiResponse<List<ActivityResponse>>> getActivitiesByPriority(
            @PathVariable ActivityPriority priority) {
        log.info("Fetching activities by priority: {}", priority);
        List<ActivityResponse> activities = activityService.getActivitiesByPriority(priority);

        return ResponseEntity.ok(
                ApiResponse.<List<ActivityResponse>>builder()
                        .success(true)
                        .message("Activities retrieved successfully")
                        .data(activities)
                        .build());
    }

    @GetMapping("/lead/{leadId}")
    public ResponseEntity<ApiResponse<List<ActivityResponse>>> getActivitiesByLead(
            @PathVariable String leadId) {
        log.info("Fetching activities for lead: {}", leadId);
        List<ActivityResponse> activities = activityService.getActivitiesByLead(leadId);

        return ResponseEntity.ok(
                ApiResponse.<List<ActivityResponse>>builder()
                        .success(true)
                        .message("Activities retrieved successfully")
                        .data(activities)
                        .build());
    }

    @GetMapping("/contact/{contactId}")
    public ResponseEntity<ApiResponse<List<ActivityResponse>>> getActivitiesByContact(
            @PathVariable String contactId) {
        log.info("Fetching activities for contact: {}", contactId);
        List<ActivityResponse> activities = activityService.getActivitiesByContact(contactId);

        return ResponseEntity.ok(
                ApiResponse.<List<ActivityResponse>>builder()
                        .success(true)
                        .message("Activities retrieved successfully")
                        .data(activities)
                        .build());
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<ApiResponse<List<ActivityResponse>>> getActivitiesByAccount(
            @PathVariable String accountId) {
        log.info("Fetching activities for account: {}", accountId);
        List<ActivityResponse> activities = activityService.getActivitiesByAccount(accountId);

        return ResponseEntity.ok(
                ApiResponse.<List<ActivityResponse>>builder()
                        .success(true)
                        .message("Activities retrieved successfully")
                        .data(activities)
                        .build());
    }

    @GetMapping("/opportunity/{opportunityId}")
    public ResponseEntity<ApiResponse<List<ActivityResponse>>> getActivitiesByOpportunity(
            @PathVariable String opportunityId) {
        log.info("Fetching activities for opportunity: {}", opportunityId);
        List<ActivityResponse> activities = activityService.getActivitiesByOpportunity(opportunityId);

        return ResponseEntity.ok(
                ApiResponse.<List<ActivityResponse>>builder()
                        .success(true)
                        .message("Activities retrieved successfully")
                        .data(activities)
                        .build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<ActivityResponse>>> getActivitiesByUser(
            @PathVariable String userId) {
        log.info("Fetching activities for user: {}", userId);
        List<ActivityResponse> activities = activityService.getActivitiesByUser(userId);

        return ResponseEntity.ok(
                ApiResponse.<List<ActivityResponse>>builder()
                        .success(true)
                        .message("Activities retrieved successfully")
                        .data(activities)
                        .build());
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<ActivityResponse>>> getActiveActivities() {
        log.info("Fetching active activities");
        List<ActivityResponse> activities = activityService.getActiveActivities();

        return ResponseEntity.ok(
                ApiResponse.<List<ActivityResponse>>builder()
                        .success(true)
                        .message("Activities retrieved successfully")
                        .data(activities)
                        .build());
    }

    @GetMapping("/overdue")
    public ResponseEntity<ApiResponse<List<ActivityResponse>>> getOverdueActivities() {
        log.info("Fetching overdue activities");
        List<ActivityResponse> activities = activityService.getOverdueActivities();

        return ResponseEntity.ok(
                ApiResponse.<List<ActivityResponse>>builder()
                        .success(true)
                        .message("Activities retrieved successfully")
                        .data(activities)
                        .build());
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<ActivityResponse>>> searchActivities(
            @RequestParam String q) {
        log.info("Searching activities with query: {}", q);
        List<ActivityResponse> activities = activityService.searchActivities(q);

        return ResponseEntity.ok(
                ApiResponse.<List<ActivityResponse>>builder()
                        .success(true)
                        .message("Search completed successfully")
                        .data(activities)
                        .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ActivityResponse>> updateActivity(
            @PathVariable String id,
            @Valid @RequestBody UpdateActivityRequest request) {

        String currentUserId = getCurrentUserId();
        log.info("User {} updating activity {}", currentUserId, id);

        ActivityResponse activity = activityService.updateActivity(id, request, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<ActivityResponse>builder()
                        .success(true)
                        .message("Activity updated successfully")
                        .data(activity)
                        .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteActivity(@PathVariable String id) {
        String currentUserId = getCurrentUserId();
        log.info("User {} deleting activity {}", currentUserId, id);

        activityService.deleteActivity(id, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Activity deleted successfully")
                        .build());
    }

    @GetMapping("/statistics/count")
    public ResponseEntity<ApiResponse<Long>> getActivityCount() {
        log.info("Fetching activity count");
        long count = activityService.getActivityCount();

        return ResponseEntity.ok(
                ApiResponse.<Long>builder()
                        .success(true)
                        .message("Activity count retrieved successfully")
                        .data(count)
                        .build());
    }

    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<ActivityStatistics>> getStatistics() {
        log.info("Fetching activity statistics");
        ActivityStatistics stats = activityService.getStatistics();

        return ResponseEntity.ok(
                ApiResponse.<ActivityStatistics>builder()
                        .success(true)
                        .message("Statistics retrieved successfully")
                        .data(stats)
                        .build());
    }

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }
}
