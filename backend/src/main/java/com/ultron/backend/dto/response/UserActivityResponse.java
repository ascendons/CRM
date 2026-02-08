package com.ultron.backend.dto.response;

import com.ultron.backend.domain.entity.UserActivity.ActionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserActivityResponse {
    private String id;
    private String activityId;

    // User Information
    private String userId;
    private String userName;

    // Action Information
    private ActionType actionType;
    private String action;

    // Entity Information
    private String entityType;
    private String entityId;
    private String entityName;

    // Description
    private String description;

    // State Transition
    private String oldValue;
    private String newValue;

    // Timestamp
    private LocalDateTime timestamp;

    // Request Context
    private String ipAddress;
    private String userAgent;
    private String requestUrl;
    private String httpMethod;

    // Metadata
    private Map<String, Object> metadata;
}
