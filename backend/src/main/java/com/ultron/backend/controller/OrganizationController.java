package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.Organization;
import com.ultron.backend.dto.request.OrganizationRegistrationRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.OrganizationRegistrationResponse;
import com.ultron.backend.multitenancy.TenantContext;
import com.ultron.backend.repository.OrganizationRepository;
import com.ultron.backend.service.OrganizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for organization (tenant) management
 * Handles registration, settings, usage tracking, and subscription management
 */
@RestController
@RequestMapping("/organizations")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Organization Management", description = "Multi-tenant organization registration and management")
public class OrganizationController {

    private final OrganizationService organizationService;
    private final OrganizationRepository organizationRepository;

    /**
     * Register a new organization (tenant onboarding)
     * This endpoint is public - no authentication required
     */
    @PostMapping("/register")
    @Operation(
            summary = "Register new organization",
            description = "Complete tenant onboarding: creates organization, admin user, and returns JWT token for immediate login"
    )
    public ResponseEntity<ApiResponse<OrganizationRegistrationResponse>> registerOrganization(
            @Valid @RequestBody OrganizationRegistrationRequest request) {

        log.info("Organization registration request: {}", request.getOrganizationName());

        OrganizationRegistrationResponse response = organizationService.registerOrganization(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<OrganizationRegistrationResponse>builder()
                        .success(true)
                        .message("Organization registered successfully")
                        .data(response)
                        .build());
    }

    /**
     * Get current user's organization
     * Looks up the user's actual tenantId from the database
     */
    @GetMapping("/me")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(
            summary = "Get my organization",
            description = "Retrieve the authenticated user's organization details"
    )
    public ResponseEntity<ApiResponse<OrganizationDetailsResponse>> getMyOrganization(
            org.springframework.security.core.Authentication authentication) {

        String userId = authentication.getName();
        log.info("Fetching organization for user: {}", userId);

        // Get user's actual tenantId from database
        com.ultron.backend.domain.entity.User user = organizationService.getUserById(userId);

        String tenantId = user != null ? user.getTenantId() : TenantContext.getTenantId();

        if (tenantId == null || tenantId.equals("DEFAULT")) {
            // For legacy/DEFAULT users, find the default organization
            log.info("User has DEFAULT/null tenantId, looking up default organization");
            Organization organization = organizationRepository.findAll().stream().findFirst()
                    .orElse(null);

            if (organization == null) {
                return ResponseEntity.ok(ApiResponse.<OrganizationDetailsResponse>builder()
                        .success(true)
                        .message("No organization found")
                        .data(null)
                        .build());
            }

            OrganizationDetailsResponse response = mapToDetailsResponse(organization);
            return ResponseEntity.ok(ApiResponse.<OrganizationDetailsResponse>builder()
                    .success(true)
                    .message("Organization details retrieved successfully")
                    .data(response)
                    .build());
        }

        Organization organization = organizationRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        OrganizationDetailsResponse response = mapToDetailsResponse(organization);

        return ResponseEntity.ok(ApiResponse.<OrganizationDetailsResponse>builder()
                .success(true)
                .message("Organization details retrieved successfully")
                .data(response)
                .build());
    }

    /**
     * Get current organization details
     * Requires authentication - returns user's organization
     */
    @GetMapping("/current")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(
            summary = "Get current organization",
            description = "Retrieve details of the authenticated user's organization"
    )
    public ResponseEntity<ApiResponse<OrganizationDetailsResponse>> getCurrentOrganization() {
        String tenantId = TenantContext.getTenantId();

        log.info("Fetching organization details for tenant: {}", tenantId);

        Organization organization = organizationRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        OrganizationDetailsResponse response = mapToDetailsResponse(organization);

        return ResponseEntity.ok(ApiResponse.<OrganizationDetailsResponse>builder()
                .success(true)
                .message("Organization details retrieved successfully")
                .data(response)
                .build());
    }

    /**
     * Get organization usage and limits
     * Shows current resource usage vs limits
     */
    @GetMapping("/usage")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(
            summary = "Get organization usage",
            description = "Retrieve current resource usage and limits for the organization"
    )
    public ResponseEntity<ApiResponse<OrganizationUsageResponse>> getOrganizationUsage() {
        String tenantId = TenantContext.getTenantId();

        log.info("Fetching usage information for tenant: {}", tenantId);

        Organization organization = organizationRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        OrganizationUsageResponse response = OrganizationUsageResponse.builder()
                .limits(organization.getLimits())
                .usage(organization.getUsage())
                .subscriptionTier(organization.getSubscription() != null ?
                                 organization.getSubscription().getPlanType() : null)
                .status(organization.getStatus())
                .build();

        return ResponseEntity.ok(ApiResponse.<OrganizationUsageResponse>builder()
                .success(true)
                .message("Usage information retrieved successfully")
                .data(response)
                .build());
    }

    /**
     * Update organization settings
     * Admin only
     */
    @PutMapping("/settings")
    @SecurityRequirement(name = "bearer-jwt")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Update organization settings",
            description = "Update organization-wide settings (admin only)"
    )
    public ResponseEntity<ApiResponse<OrganizationDetailsResponse>> updateSettings(
            @Valid @RequestBody OrganizationSettingsUpdateRequest request) {

        String tenantId = TenantContext.getTenantId();
        log.info("Updating settings for tenant: {}", tenantId);

        Organization organization = organizationRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        // Update settings
        if (request.getDateFormat() != null) {
            organization.getSettings().setDateFormat(request.getDateFormat());
        }
        if (request.getTimeFormat() != null) {
            organization.getSettings().setTimeFormat(request.getTimeFormat());
        }
        if (request.getLanguage() != null) {
            organization.getSettings().setLanguage(request.getLanguage());
        }
        if (request.getEmailNotificationsEnabled() != null) {
            organization.getSettings().setEmailNotificationsEnabled(request.getEmailNotificationsEnabled());
        }
        if (request.getLogoUrl() != null) {
            organization.getSettings().setLogoUrl(request.getLogoUrl());
        }
        if (request.getBrandColor() != null) {
            organization.getSettings().setBrandColor(request.getBrandColor());
        }

        Organization updated = organizationRepository.save(organization);
        OrganizationDetailsResponse response = mapToDetailsResponse(updated);

        return ResponseEntity.ok(ApiResponse.<OrganizationDetailsResponse>builder()
                .success(true)
                .message("Settings updated successfully")
                .data(response)
                .build());
    }

    /**
     * Update organization profile
     * Admin only
     */
    @PutMapping("/profile")
    @SecurityRequirement(name = "bearer-jwt")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Update organization profile",
            description = "Update organization basic information (admin only)"
    )
    public ResponseEntity<ApiResponse<OrganizationDetailsResponse>> updateProfile(
            @Valid @RequestBody OrganizationProfileUpdateRequest request) {

        String tenantId = TenantContext.getTenantId();
        log.info("Updating profile for tenant: {}", tenantId);

        Organization organization = organizationRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        // Update profile
        if (request.getOrganizationName() != null) {
            organization.setOrganizationName(request.getOrganizationName());
        }
        if (request.getDisplayName() != null) {
            organization.setDisplayName(request.getDisplayName());
        }
        if (request.getIndustry() != null) {
            organization.setIndustry(request.getIndustry());
        }
        if (request.getCompanySize() != null) {
            organization.setCompanySize(request.getCompanySize());
        }
        if (request.getPrimaryEmail() != null) {
            organization.setPrimaryEmail(request.getPrimaryEmail());
        }
        if (request.getPrimaryPhone() != null) {
            organization.setPrimaryPhone(request.getPrimaryPhone());
        }

        Organization updated = organizationRepository.save(organization);
        OrganizationDetailsResponse response = mapToDetailsResponse(updated);

        return ResponseEntity.ok(ApiResponse.<OrganizationDetailsResponse>builder()
                .success(true)
                .message("Profile updated successfully")
                .data(response)
                .build());
    }

    /**
     * Update organization invoice configuration
     * Admin only
     */
    @PutMapping("/invoice-config")
    @SecurityRequirement(name = "bearer-jwt")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Update organization invoice configuration",
            description = "Update specific fields for invoice generation (admin only)"
    )
    public ResponseEntity<ApiResponse<OrganizationDetailsResponse>> updateInvoiceConfig(
            @Valid @RequestBody com.ultron.backend.dto.request.InvoiceConfigRequest request) {

        String tenantId = TenantContext.getTenantId();
        log.info("Updating invoice config for tenant: {}", tenantId);

        Organization updated = organizationService.updateInvoiceConfig(tenantId, request);
        OrganizationDetailsResponse response = mapToDetailsResponse(updated);

        return ResponseEntity.ok(ApiResponse.<OrganizationDetailsResponse>builder()
                .success(true)
                .message("Invoice configuration updated successfully")
                .data(response)
                .build());
    }

    /**
     * Check subdomain availability
     * Public endpoint for registration form validation
     */
    @GetMapping("/check-subdomain/{subdomain}")
    @Operation(
            summary = "Check subdomain availability",
            description = "Verify if a subdomain is available for registration"
    )
    public ResponseEntity<ApiResponse<SubdomainAvailabilityResponse>> checkSubdomainAvailability(
            @PathVariable String subdomain) {

        log.info("Checking subdomain availability: {}", subdomain);

        boolean available = !organizationRepository.existsBySubdomain(subdomain);

        SubdomainAvailabilityResponse response = SubdomainAvailabilityResponse.builder()
                .subdomain(subdomain)
                .available(available)
                .message(available ? "Subdomain is available" : "Subdomain is already taken")
                .build();

        return ResponseEntity.ok(ApiResponse.<SubdomainAvailabilityResponse>builder()
                .success(true)
                .message("Subdomain checked successfully")
                .data(response)
                .build());
    }

    /**
     * Get subscription details
     */
    @GetMapping("/subscription")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(
            summary = "Get subscription details",
            description = "Retrieve subscription and billing information"
    )
    public ResponseEntity<ApiResponse<Organization.SubscriptionInfo>> getSubscription() {
        String tenantId = TenantContext.getTenantId();

        Organization organization = organizationRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        return ResponseEntity.ok(ApiResponse.<Organization.SubscriptionInfo>builder()
                .success(true)
                .message("Subscription details retrieved successfully")
                .data(organization.getSubscription())
                .build());
    }

    // Helper method
    private OrganizationDetailsResponse mapToDetailsResponse(Organization org) {
        return OrganizationDetailsResponse.builder()
                .organizationId(org.getOrganizationId())
                .organizationName(org.getOrganizationName())
                .displayName(org.getDisplayName())
                .subdomain(org.getSubdomain())
                .industry(org.getIndustry())
                .companySize(org.getCompanySize())
                .primaryEmail(org.getPrimaryEmail())
                .primaryPhone(org.getPrimaryPhone())
                .status(org.getStatus())
                .subscription(org.getSubscription())
                .settings(org.getSettings())
                .security(org.getSecurity())
                .invoiceConfig(org.getInvoiceConfig())
                .createdAt(org.getCreatedAt())
                .build();
    }

    // Response DTOs
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class OrganizationDetailsResponse {
        private String organizationId;
        private String organizationName;
        private String displayName;
        private String subdomain;
        private String industry;
        private String companySize;
        private String primaryEmail;
        private String primaryPhone;
        private Organization.OrganizationStatus status;
        private Organization.SubscriptionInfo subscription;
        private Organization.OrganizationSettings settings;
        private Organization.SecuritySettings security;
        private Organization.InvoiceConfig invoiceConfig;
        private java.time.LocalDateTime createdAt;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class OrganizationUsageResponse {
        private Organization.UsageLimits limits;
        private Organization.UsageMetrics usage;
        private String subscriptionTier;
        private Organization.OrganizationStatus status;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class SubdomainAvailabilityResponse {
        private String subdomain;
        private Boolean available;
        private String message;
    }

    // Request DTOs
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class OrganizationSettingsUpdateRequest {
        private String dateFormat;
        private String timeFormat;
        private String language;
        private Boolean emailNotificationsEnabled;
        private String logoUrl;
        private String brandColor;
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class OrganizationProfileUpdateRequest {
        private String organizationName;
        private String displayName;
        private String industry;
        private String companySize;
        private String primaryEmail;
        private String primaryPhone;
    }
}
