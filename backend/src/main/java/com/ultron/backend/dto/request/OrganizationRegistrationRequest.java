package com.ultron.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for organization registration (tenant onboarding)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationRegistrationRequest {

    @NotBlank(message = "Organization name is required")
    @Size(min = 2, max = 100, message = "Organization name must be between 2 and 100 characters")
    private String organizationName;

    @NotBlank(message = "Subdomain is required")
    @Pattern(regexp = "^[a-z0-9-]+$", message = "Subdomain must contain only lowercase letters, numbers, and hyphens")
    @Size(min = 3, max = 50, message = "Subdomain must be between 3 and 50 characters")
    private String subdomain;

    @NotBlank(message = "Admin name is required")
    @Size(min = 2, max = 100, message = "Admin name must be between 2 and 100 characters")
    private String adminName;

    @NotBlank(message = "Admin email is required")
    @Email(message = "Invalid email format")
    private String adminEmail;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    private String industry;
    private String companySize;
    private String country;

    @Builder.Default
    private String subscriptionTier = "FREE";  // FREE, STARTER, PROFESSIONAL, ENTERPRISE

    private String logoUrl;

    // Short abbreviation used in proposal reference numbers (e.g. "RKE" → RKE/26/P001)
    @Size(min = 2, max = 4, message = "Proposal prefix must be 2–4 characters")
    @Pattern(regexp = "^[A-Za-z0-9]*$", message = "Proposal prefix must be alphanumeric")
    private String proposalPrefix;
}
