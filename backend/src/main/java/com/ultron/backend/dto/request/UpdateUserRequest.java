package com.ultron.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * All fields are optional for PATCH semantics.
 * Only non-null fields will be updated.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {

    // Email (username cannot be changed)
    @Email(message = "Email must be valid")
    private String email;

    // Profile Information
    @Size(min = 1, max = 50, message = "First name must be between 1 and 50 characters")
    private String firstName;

    @Size(min = 1, max = 50, message = "Last name must be between 1 and 50 characters")
    private String lastName;

    @Size(max = 100, message = "Title cannot exceed 100 characters")
    private String title;

    @Size(max = 100, message = "Department cannot exceed 100 characters")
    private String department;

    @Pattern(regexp = "^[+]?[0-9\\s()-]{7,20}$", message = "Phone must be valid")
    private String phone;

    @Pattern(regexp = "^[+]?[0-9\\s()-]{7,20}$", message = "Mobile phone must be valid")
    private String mobilePhone;

    private String avatar;

    // Access Control
    private String roleId;
    private String profileId;

    // Organization Hierarchy
    private String managerId;
    private String teamId;
    private String territoryId;

    // Settings
    private String timeZone;
    private String language;
    private String dateFormat;
    private String currency;
    private Boolean emailNotifications;
    private Boolean desktopNotifications;
}
