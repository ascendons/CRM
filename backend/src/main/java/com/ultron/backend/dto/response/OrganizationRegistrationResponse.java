package com.ultron.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for organization registration
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationRegistrationResponse {

    private String organizationId;
    private String tenantId;
    private String subdomain;
    private String organizationName;

    private String userId;
    private String userEmail;

    private String token;  // JWT token for immediate login

    private String subscriptionTier;
    private Integer trialDaysRemaining;

    private String message;
}
