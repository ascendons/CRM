package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.UserActivity;
import com.ultron.backend.domain.entity.UserActivity.ActionType;
import com.ultron.backend.dto.request.LogPageViewRequest;
import com.ultron.backend.dto.request.UserActivityFilterRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.UserActivityResponse;
import com.ultron.backend.dto.response.UserActivityStatsResponse;
import com.ultron.backend.service.UserActivityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/user-activities")
@RequiredArgsConstructor
@Slf4j
public class UserActivityController {

    private final UserActivityService userActivityService;

    /**
     * Get current user's activities
     * GET /api/v1/user-activities/me
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Page<UserActivityResponse>>> getMyActivities(
            @RequestParam(required = false) ActionType actionType,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {

        String currentUserId = authentication.getName();
        log.info("User {} fetching their activities", currentUserId);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));

        Page<UserActivity> activities;

        // Apply filters
        if (startDate != null && endDate != null) {
            activities = userActivityService.getUserActivitiesByTimeRange(
                    currentUserId, startDate, endDate, pageable);
        } else if (actionType != null) {
            activities = userActivityService.getUserActivitiesByActionType(
                    currentUserId, actionType, pageable);
        } else {
            activities = userActivityService.getUserActivities(currentUserId, pageable);
        }

        Page<UserActivityResponse> response = activities.map(this::mapToResponse);

        return ResponseEntity.ok(
                ApiResponse.<Page<UserActivityResponse>>builder()
                        .success(true)
                        .message("Activities retrieved successfully")
                        .data(response)
                        .build());
    }

    /**
     * Get all user activities (admin only)
     * GET /api/v1/user-activities/all
     */
    @GetMapping("/all")
//    @PreAuthorize("hasSystemPermission('canViewAllData')")
    public ResponseEntity<ApiResponse<Page<UserActivityResponse>>> getAllActivities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {

        String currentUserId = authentication.getName();
        log.info("Admin user {} fetching all activities", currentUserId);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        Page<UserActivity> activities = userActivityService.getAllActivities(pageable);
        Page<UserActivityResponse> response = activities.map(this::mapToResponse);

        return ResponseEntity.ok(
                ApiResponse.<Page<UserActivityResponse>>builder()
                        .success(true)
                        .message("All activities retrieved successfully")
                        .data(response)
                        .build());
    }

    /**
     * Get activities by filter
     * POST /api/v1/user-activities/filter
     */
    @PostMapping("/filter")
    public ResponseEntity<ApiResponse<Page<UserActivityResponse>>> getActivitiesByFilter(
            @Valid @RequestBody UserActivityFilterRequest filterRequest,
            Authentication authentication) {

        String currentUserId = authentication.getName();
        log.info("User {} filtering activities", currentUserId);

        // Use current user's ID if not specified (non-admin users)
        String userId = filterRequest.getUserId() != null ? filterRequest.getUserId() : currentUserId;

        Pageable pageable = PageRequest.of(
                filterRequest.getPage(),
                filterRequest.getSize(),
                Sort.Direction.fromString(filterRequest.getSortDirection()),
                filterRequest.getSortBy()
        );

        Page<UserActivity> activities;

        // Apply filters based on request
        if (filterRequest.getEntityType() != null && filterRequest.getEntityId() != null) {
            activities = userActivityService.getEntityActivities(
                    filterRequest.getEntityType(),
                    filterRequest.getEntityId(),
                    pageable);
        } else if (filterRequest.getStartDate() != null && filterRequest.getEndDate() != null) {
            activities = userActivityService.getUserActivitiesByTimeRange(
                    userId,
                    filterRequest.getStartDate(),
                    filterRequest.getEndDate(),
                    pageable);
        } else if (filterRequest.getActionType() != null) {
            activities = userActivityService.getUserActivitiesByActionType(
                    userId,
                    filterRequest.getActionType(),
                    pageable);
        } else if (filterRequest.getEntityType() != null) {
            activities = userActivityService.getActivitiesByEntityType(
                    filterRequest.getEntityType(),
                    pageable);
        } else {
            activities = userActivityService.getUserActivities(userId, pageable);
        }

        Page<UserActivityResponse> response = activities.map(this::mapToResponse);

        return ResponseEntity.ok(
                ApiResponse.<Page<UserActivityResponse>>builder()
                        .success(true)
                        .message("Filtered activities retrieved successfully")
                        .data(response)
                        .build());
    }

    /**
     * Get activity statistics for current user
     * GET /api/v1/user-activities/stats/me
     */
    @GetMapping("/stats/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyStats(
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate,
            Authentication authentication) {

        String currentUserId = authentication.getName();
        log.info("User {} fetching their activity statistics", currentUserId);

        // Default to last 30 days if not specified
        LocalDateTime start = startDate != null ? startDate : LocalDateTime.now().minusDays(30);
        LocalDateTime end = endDate != null ? endDate : LocalDateTime.now();

        Map<String, Object> stats = userActivityService.getUserActivityStats(currentUserId, start, end);

        return ResponseEntity.ok(
                ApiResponse.<Map<String, Object>>builder()
                        .success(true)
                        .message("Activity statistics retrieved successfully")
                        .data(stats)
                        .build());
    }

    /**
     * Get global activity statistics (admin only)
     * GET /api/v1/user-activities/stats/global
     */
    @GetMapping("/stats/global")
//    @PreAuthorize("hasSystemPermission('canViewAllData')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getGlobalStats(
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate,
            Authentication authentication) {

        String currentUserId = authentication.getName();
        log.info("Admin user {} fetching global activity statistics", currentUserId);

        // Default to last 30 days if not specified
        LocalDateTime start = startDate != null ? startDate : LocalDateTime.now().minusDays(30);
        LocalDateTime end = endDate != null ? endDate : LocalDateTime.now();

        Map<String, Object> stats = userActivityService.getGlobalActivityStats(start, end);

        return ResponseEntity.ok(
                ApiResponse.<Map<String, Object>>builder()
                        .success(true)
                        .message("Global activity statistics retrieved successfully")
                        .data(stats)
                        .build());
    }

    /**
     * Log a page view
     * POST /api/v1/user-activities/page-view
     */
    @PostMapping("/page-view")
    public ResponseEntity<ApiResponse<UserActivityResponse>> logPageView(
            @Valid @RequestBody LogPageViewRequest request,
            Authentication authentication) {

        String currentUserId = authentication.getName();
        log.debug("User {} viewed page: {}", currentUserId, request.getPageTitle());

        UserActivity activity = userActivityService.logPageView(
                currentUserId,
                request.getPageUrl(),
                request.getPageTitle(),
                request.getPreviousPage()
        );

        UserActivityResponse response = mapToResponse(activity);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.<UserActivityResponse>builder()
                        .success(true)
                        .message("Page view logged successfully")
                        .data(response)
                        .build());
    }

    /**
     * Get activities for a specific entity
     * GET /api/v1/user-activities/entity/{entityType}/{entityId}
     */
    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<ApiResponse<Page<UserActivityResponse>>> getEntityActivities(
            @PathVariable String entityType,
            @PathVariable String entityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {

        String currentUserId = authentication.getName();
        log.info("User {} fetching activities for entity: {}/{}", currentUserId, entityType, entityId);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        Page<UserActivity> activities = userActivityService.getEntityActivities(entityType, entityId, pageable);
        Page<UserActivityResponse> response = activities.map(this::mapToResponse);

        return ResponseEntity.ok(
                ApiResponse.<Page<UserActivityResponse>>builder()
                        .success(true)
                        .message("Entity activities retrieved successfully")
                        .data(response)
                        .build());
    }

    // Helper method to map entity to response
    private UserActivityResponse mapToResponse(UserActivity activity) {
        return UserActivityResponse.builder()
                .id(activity.getId())
                .activityId(activity.getActivityId())
                .userId(activity.getUserId())
                .userName(activity.getUserName())
                .actionType(activity.getActionType())
                .action(activity.getAction())
                .entityType(activity.getEntityType())
                .entityId(activity.getEntityId())
                .entityName(activity.getEntityName())
                .description(activity.getDescription())
                .oldValue(activity.getOldValue())
                .newValue(activity.getNewValue())
                .timestamp(activity.getTimestamp())
                .ipAddress(activity.getIpAddress())
                .userAgent(activity.getUserAgent())
                .requestUrl(activity.getRequestUrl())
                .httpMethod(activity.getHttpMethod())
                .metadata(activity.getMetadata())
                .build();
    }
}
