package com.ultron.backend.service;

import com.ultron.backend.domain.entity.UserActivity;
import com.ultron.backend.domain.entity.UserActivity.ActionType;
import com.ultron.backend.repository.UserActivityRepository;
import com.ultron.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service for tracking user activities across the dashboard
 * Provides comprehensive activity monitoring and analytics
 *
 * MULTI-TENANT AWARE: All operations are scoped to current tenant context
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserActivityService extends BaseTenantService {

    private final UserActivityRepository userActivityRepository;
    private final UserRepository userRepository;
    private final UserActivityIdGeneratorService idGeneratorService;

    /**
     * Log a user activity asynchronously
     * This method runs in a separate thread to avoid impacting main transaction performance
     * MULTI-TENANT AWARE: TenantContext is propagated to async thread
     */
    @Async
    public void logActivityAsync(String userId, ActionType actionType, String action,
                                  String entityType, String entityId, String entityName,
                                  String description, String oldValue, String newValue,
                                  Map<String, Object> metadata) {
        logActivity(userId, actionType, action, entityType, entityId, entityName,
                   description, oldValue, newValue, metadata);
    }

    /**
     * Log a user activity synchronously with full details
     * MULTI-TENANT AWARE: Sets tenantId for data isolation
     */
    public UserActivity logActivity(String userId, ActionType actionType, String action,
                                    String entityType, String entityId, String entityName,
                                    String description, String oldValue, String newValue,
                                    Map<String, Object> metadata) {

        // Get current tenant ID for multi-tenancy
        String tenantId = getCurrentTenantId();

        return logActivityWithTenant(userId, tenantId, actionType, action, entityType, entityId,
                                     entityName, description, oldValue, newValue, metadata);
    }

    /**
     * Log a user activity with explicit tenantId (used when tenant context is not available)
     * Use this during authentication or other scenarios where tenant context isn't set yet
     */
    public UserActivity logActivityWithTenant(String userId, String tenantId, ActionType actionType, String action,
                                             String entityType, String entityId, String entityName,
                                             String description, String oldValue, String newValue,
                                             Map<String, Object> metadata) {

        String userName = getUserName(userId);
        String activityId = idGeneratorService.generateActivityId();

        // Capture request context if available
        RequestContext requestContext = captureRequestContext();

        UserActivity activity = UserActivity.builder()
                .activityId(activityId)
                .tenantId(tenantId)  // CRITICAL: Set tenant ID for data isolation
                .userId(userId)
                .userName(userName)
                .actionType(actionType)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .entityName(entityName)
                .description(description)
                .oldValue(oldValue)
                .newValue(newValue)
                .timestamp(LocalDateTime.now())
                .ipAddress(requestContext.ipAddress)
                .userAgent(requestContext.userAgent)
                .requestUrl(requestContext.requestUrl)
                .httpMethod(requestContext.httpMethod)
                .metadata(metadata)
                .build();

        UserActivity saved = userActivityRepository.save(activity);

        log.debug("[Tenant: {}] User activity logged: activityId={}, user={}, action={}, entityType={}",
                tenantId, activityId, userName, action, entityType);

        return saved;
    }

    /**
     * Simplified method for logging API operations (CREATE, UPDATE, DELETE)
     */
    public UserActivity logApiOperation(String userId, ActionType actionType,
                                       String entityType, String entityId, String entityName,
                                       String oldValue, String newValue) {

        String action = actionType.name();
        String description = String.format("%s %s: %s",
                actionType.name().toLowerCase(),
                entityType.toLowerCase(),
                entityName != null ? entityName : entityId);

        return logActivity(userId, actionType, action, entityType, entityId, entityName,
                          description, oldValue, newValue, null);
    }

    /**
     * Log a page view activity
     */
    public UserActivity logPageView(String userId, String pageUrl, String pageTitle,
                                   String previousPage) {

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("pageTitle", pageTitle);
        if (previousPage != null) {
            metadata.put("previousPage", previousPage);
        }

        String description = String.format("Viewed page: %s", pageTitle);

        return logActivity(userId, ActionType.PAGE_VIEW, "PAGE_VIEW",
                          null, null, pageTitle,
                          description, null, null, metadata);
    }

    /**
     * Log a login activity
     */
    public UserActivity logLogin(String userId, boolean success) {
        String action = success ? "LOGIN_SUCCESS" : "LOGIN_FAILED";
        String description = success ? "User logged in successfully" : "Login attempt failed";

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("success", success);

        return logActivity(userId, ActionType.LOGIN, action,
                          null, null, null,
                          description, null, null, metadata);
    }

    /**
     * Log a login activity with explicit tenantId (used during authentication before context is set)
     */
    public UserActivity logLogin(String userId, String tenantId, boolean success) {
        String action = success ? "LOGIN_SUCCESS" : "LOGIN_FAILED";
        String description = success ? "User logged in successfully" : "Login attempt failed";

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("success", success);

        return logActivityWithTenant(userId, tenantId, ActionType.LOGIN, action,
                          null, null, null,
                          description, null, null, metadata);
    }

    /**
     * Log a search activity
     */
    public UserActivity logSearch(String userId, String entityType, String searchQuery,
                                 int resultCount) {

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("searchQuery", searchQuery);
        metadata.put("resultCount", resultCount);

        String description = String.format("Searched %s with query: %s (%d results)",
                entityType, searchQuery, resultCount);

        return logActivity(userId, ActionType.SEARCH, "SEARCH",
                          entityType, null, null,
                          description, null, null, metadata);
    }

    // Query methods - MULTI-TENANT SAFE

    /**
     * Get activities for a specific user within tenant
     * MULTI-TENANT SAFE
     */
    public Page<UserActivity> getUserActivities(String userId, Pageable pageable) {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching activities for user: {}", tenantId, userId);
        return userActivityRepository.findByUserIdAndTenantIdOrderByTimestampDesc(userId, tenantId, pageable);
    }

    /**
     * Get all activities within tenant (admin view)
     * MULTI-TENANT SAFE
     */
    public Page<UserActivity> getAllActivities(Pageable pageable) {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching all activities", tenantId);
        return userActivityRepository.findByTenantIdOrderByTimestampDesc(tenantId, pageable);
    }

    /**
     * Get activities by action type within tenant
     * MULTI-TENANT SAFE
     */
    public Page<UserActivity> getActivitiesByActionType(ActionType actionType, Pageable pageable) {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching activities by action type: {}", tenantId, actionType);
        return userActivityRepository.findByActionTypeAndTenantIdOrderByTimestampDesc(actionType, tenantId, pageable);
    }

    /**
     * Get user activities by action type within tenant
     * MULTI-TENANT SAFE
     */
    public Page<UserActivity> getUserActivitiesByActionType(String userId, ActionType actionType, Pageable pageable) {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching activities for user {} by action type: {}", tenantId, userId, actionType);
        return userActivityRepository.findByUserIdAndActionTypeAndTenantIdOrderByTimestampDesc(userId, actionType, tenantId, pageable);
    }

    /**
     * Get activities by entity type within tenant
     * MULTI-TENANT SAFE
     */
    public Page<UserActivity> getActivitiesByEntityType(String entityType, Pageable pageable) {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching activities by entity type: {}", tenantId, entityType);
        return userActivityRepository.findByEntityTypeAndTenantIdOrderByTimestampDesc(entityType, tenantId, pageable);
    }

    /**
     * Get activities for a specific entity within tenant
     * MULTI-TENANT SAFE
     */
    public Page<UserActivity> getEntityActivities(String entityType, String entityId, Pageable pageable) {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching activities for entity: {}:{}", tenantId, entityType, entityId);
        return userActivityRepository.findByEntityTypeAndEntityIdAndTenantIdOrderByTimestampDesc(
                entityType, entityId, tenantId, pageable);
    }

    /**
     * Get activities within a time range within tenant
     * MULTI-TENANT SAFE
     */
    public Page<UserActivity> getActivitiesByTimeRange(LocalDateTime start, LocalDateTime end,
                                                       Pageable pageable) {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching activities between {} and {}", tenantId, start, end);
        return userActivityRepository.findByTimestampBetweenAndTenantIdOrderByTimestampDesc(start, end, tenantId, pageable);
    }

    /**
     * Get user activities within a time range within tenant
     * MULTI-TENANT SAFE
     */
    public Page<UserActivity> getUserActivitiesByTimeRange(String userId, LocalDateTime start,
                                                           LocalDateTime end, Pageable pageable) {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching activities for user {} between {} and {}", tenantId, userId, start, end);
        return userActivityRepository.findByUserIdAndTimestampBetweenAndTenantIdOrderByTimestampDesc(
                userId, start, end, tenantId, pageable);
    }

    /**
     * Get activity statistics for a user within tenant
     * MULTI-TENANT SAFE
     */
    public Map<String, Object> getUserActivityStats(String userId, LocalDateTime start, LocalDateTime end) {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching activity stats for user: {}", tenantId, userId);

        Map<String, Object> stats = new HashMap<>();

        long totalActivities = userActivityRepository.countByUserIdAndTimestampBetweenAndTenantId(userId, start, end, tenantId);
        stats.put("totalActivities", totalActivities);

        // Count by action type within tenant
        Map<String, Long> actionTypeCounts = new HashMap<>();
        for (ActionType actionType : ActionType.values()) {
            List<UserActivity> activities = userActivityRepository
                    .findByUserIdAndActionTypeAndTenantIdOrderByTimestampDesc(userId, actionType, tenantId);
            actionTypeCounts.put(actionType.name(), (long) activities.size());
        }
        stats.put("actionTypeCounts", actionTypeCounts);

        return stats;
    }

    /**
     * Get tenant-wide activity statistics (admin)
     * MULTI-TENANT SAFE
     */
    public Map<String, Object> getGlobalActivityStats(LocalDateTime start, LocalDateTime end) {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching global activity stats", tenantId);

        Map<String, Object> stats = new HashMap<>();

        long totalActivities = userActivityRepository.countByTimestampBetweenAndTenantId(start, end, tenantId);
        stats.put("totalActivities", totalActivities);

        // Count by action type within tenant
        Map<String, Long> actionTypeCounts = new HashMap<>();
        for (ActionType actionType : ActionType.values()) {
            long count = userActivityRepository.countByActionTypeAndTenantId(actionType, tenantId);
            actionTypeCounts.put(actionType.name(), count);
        }
        stats.put("actionTypeCounts", actionTypeCounts);

        return stats;
    }

    /**
     * Get activity by ID with tenant validation
     * MULTI-TENANT SAFE
     */
    public Optional<UserActivity> getActivityById(String activityId) {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching activity by ID: {}", tenantId, activityId);

        Optional<UserActivity> activity = userActivityRepository.findByActivityIdAndTenantId(activityId, tenantId);

        if (activity.isPresent()) {
            // Double-check tenant ownership
            validateResourceTenantOwnership(activity.get().getTenantId());
        }

        return activity;
    }

    /**
     * Count total activities within tenant
     * MULTI-TENANT SAFE
     */
    public long countActivities() {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Counting total activities", tenantId);
        return userActivityRepository.countByTenantId(tenantId);
    }

    /**
     * Count activities by user within tenant
     * MULTI-TENANT SAFE
     */
    public long countUserActivities(String userId) {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Counting activities for user: {}", tenantId, userId);
        return userActivityRepository.countByUserIdAndTenantId(userId, tenantId);
    }

    // Helper methods

    private String getUserName(String userId) {
        if ("SYSTEM".equals(userId)) {
            return "System";
        }

        return userRepository.findById(userId)
                .map(user -> {
                    if (user.getProfile() != null && user.getProfile().getFullName() != null) {
                        return user.getProfile().getFullName();
                    }
                    return user.getUsername();
                })
                .orElse("Unknown");
    }

    private RequestContext captureRequestContext() {
        RequestContext context = new RequestContext();

        try {
            ServletRequestAttributes attributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();

                context.ipAddress = getClientIpAddress(request);
                context.userAgent = request.getHeader("User-Agent");
                context.requestUrl = request.getRequestURI();
                context.httpMethod = request.getMethod();
            }
        } catch (Exception e) {
            log.debug("Failed to capture request context: {}", e.getMessage());
        }

        return context;
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String[] headers = {
                "X-Forwarded-For",
                "Proxy-Client-IP",
                "WL-Proxy-Client-IP",
                "HTTP_X_FORWARDED_FOR",
                "HTTP_X_FORWARDED",
                "HTTP_X_CLUSTER_CLIENT_IP",
                "HTTP_CLIENT_IP",
                "HTTP_FORWARDED_FOR",
                "HTTP_FORWARDED",
                "HTTP_VIA",
                "REMOTE_ADDR"
        };

        for (String header : headers) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                return ip.split(",")[0].trim();
            }
        }

        return request.getRemoteAddr();
    }

    private static class RequestContext {
        String ipAddress;
        String userAgent;
        String requestUrl;
        String httpMethod;
    }
}
