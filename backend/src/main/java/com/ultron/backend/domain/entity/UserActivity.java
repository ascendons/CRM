package com.ultron.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * User activity tracking entity for dashboard activity monitoring
 * Tracks both API-level operations and page-level navigation
 */
@Document(collection = "user_activities")
@CompoundIndexes({
    @CompoundIndex(name = "user_timestamp_idx", def = "{'userId': 1, 'timestamp': -1}"),
    @CompoundIndex(name = "entity_type_action_idx", def = "{'entityType': 1, 'actionType': 1, 'timestamp': -1}"),
    @CompoundIndex(name = "timestamp_idx", def = "{'timestamp': -1}")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserActivity {

    @Id
    private String id;

    // Business ID (e.g., UACT-2025-02-00001)
    @Indexed(unique = true)
    private String activityId;

    // Multi-tenancy
    @Indexed
    private String tenantId;

    // User Information
    @Indexed
    private String userId;      // User who performed the action
    private String userName;    // User's display name

    // Action Information
    @Indexed
    private ActionType actionType;  // Type of action performed

    private String action;          // Specific action description (e.g., "CREATED", "VIEWED_PAGE")

    // Entity Information (null for page visits)
    @Indexed
    private String entityType;  // "LEAD", "CONTACT", "PRODUCT", "PROPOSAL", etc.

    private String entityId;    // MongoDB ObjectId of the entity (null for page visits)

    private String entityName;  // Friendly name (e.g., lead title, product name)

    // Description
    private String description; // Human-readable description of the action

    // State Transition (null for simple actions)
    private String oldValue;    // Previous state/value
    private String newValue;    // New state/value

    // Timestamp
    @Indexed
    private LocalDateTime timestamp;

    // Request Context
    private String ipAddress;   // IP address of the user
    private String userAgent;   // Browser/client information
    private String requestUrl;  // API endpoint or page URL
    private String httpMethod;  // GET, POST, PUT, DELETE, etc.

    // Metadata (flexible for additional data)
    private Map<String, Object> metadata;  // Additional context-specific data
                                          // For page visits: {pageTitle, previousPage, duration}
                                          // For API calls: {requestParams, responseStatus}

    /**
     * Action types for categorizing user activities
     */
    public enum ActionType {
        // API Operations
        CREATE,         // Created a new entity
        READ,          // Read/viewed an entity
        UPDATE,        // Updated an entity
        DELETE,        // Deleted an entity
        SEARCH,        // Performed a search
        EXPORT,        // Exported data
        IMPORT,        // Imported data

        // Page Navigation
        PAGE_VIEW,     // Visited a page

        // Authentication
        LOGIN,         // User logged in
        LOGOUT,        // User logged out

        // Other Actions
        DOWNLOAD,      // Downloaded a file
        UPLOAD,        // Uploaded a file
        SHARE,         // Shared content
        PRINT,         // Printed content
        CUSTOM         // Custom action type
    }
}
