package com.ultron.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserRequest {

    // Authentication
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Username can only contain letters, numbers, dots, underscores, and hyphens")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
        message = "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character (@$!%*?&)"
    )
    private String password;

    // Profile Information
    @NotBlank(message = "First name is required")
    @Size(min = 1, max = 50, message = "First name must be between 1 and 50 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
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

    // Access Control
    @NotBlank(message = "Role ID is required")
    private String roleId;

    @NotBlank(message = "Profile ID is required")
    private String profileId;

    // Organization Hierarchy
    private String managerId;
    private String teamId;
    private String territoryId;

    // Settings (optional, will use defaults if not provided)
    private String timeZone;
    private String language;
    private String dateFormat;
    private String currency;
    private Boolean emailNotifications;
    private Boolean desktopNotifications;
}
