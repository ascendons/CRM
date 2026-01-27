package com.ultron.backend.dto.response;

import com.ultron.backend.domain.enums.UserRole;
import com.ultron.backend.domain.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for current user information.
 * Used by /me endpoint to return user details for dashboard display.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurrentUserResponse {

    // Basic Info
    private String id;
    private String userId;  // Business ID (USR-YYYY-MM-XXXXX)
    private String username;
    private String email;
    private String fullName;
    private String firstName;
    private String lastName;
    private String avatar;
    private String title;
    private String department;

    // Role & Permissions
    private UserRole userRole;  // Unified role enum (ADMIN, MANAGER, SALES_REP, USER)

    // RBAC Info (hierarchical roles and profiles)
    private String roleId;
    private String roleName;
    private String profileId;
    private String profileName;

    // Organization
    private String managerId;
    private String managerName;

    // Status
    private UserStatus status;
    private LocalDateTime lastLoginAt;
}
