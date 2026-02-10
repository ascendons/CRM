package com.ultron.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Organization entity - The tenant root in multi-tenant CRM
 * Each organization represents one customer/company using the CRM platform
 */
@Document(collection = "organizations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Organization {

    @Id
    private String id;

    @Indexed(unique = true)
    private String organizationId;  // ORG-YYYYMM-XXXXX

    // Basic Information
    private String organizationName;
    private String displayName;
    private String domain;  // company.com - for email domain verification

    @Indexed(unique = true)
    private String subdomain;  // company.yourcrm.com (optional for SaaS model)

    private String industry;
    private String companySize;
    private String country;
    private String timezone;
    private String currency;
    private String primaryEmail;
    private String primaryPhone;

    // Subscription & Billing
    private SubscriptionInfo subscription;

    // Usage Tracking
    private UsageLimits limits;
    private UsageMetrics usage;

    // Settings
    private OrganizationSettings settings;

    // Status
    @Indexed
    private OrganizationStatus status;  // TRIAL, ACTIVE, SUSPENDED, EXPIRED, CANCELLED

    // Security
    private SecuritySettings security;

    // Audit Fields
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;

    // Soft Delete
    @Builder.Default
    private Boolean isDeleted = false;
    private LocalDateTime deletedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubscriptionInfo {
        private String planType;  // FREE, STARTER, PROFESSIONAL, ENTERPRISE
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private LocalDateTime trialEndDate;
        private BigDecimal monthlyPrice;
        private String billingCycle;  // MONTHLY, QUARTERLY, ANNUAL
        private String paymentStatus;  // ACTIVE, PAST_DUE, CANCELLED
        private String stripeCustomerId;
        private String stripeSubscriptionId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UsageLimits {
        private Integer maxUsers;
        private Integer maxContacts;
        private Integer maxLeads;
        private Integer maxAccounts;
        private Integer maxOpportunities;
        private Integer maxProducts;
        private Long maxStorageMB;
        private Integer maxApiCallsPerDay;
        private Boolean customFieldsEnabled;
        private Boolean advancedReportsEnabled;
        private Boolean apiAccessEnabled;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UsageMetrics {
        private Integer currentUsers;
        private Integer currentContacts;
        private Integer currentLeads;
        private Integer currentAccounts;
        private Integer currentOpportunities;
        private Integer currentProducts;
        private Long currentStorageMB;
        private Integer apiCallsToday;
        private LocalDateTime lastCalculated;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrganizationSettings {
        @Builder.Default
        private String dateFormat = "DD/MM/YYYY";
        @Builder.Default
        private String timeFormat = "HH:mm";
        @Builder.Default
        private String language = "en";
        @Builder.Default
        private Boolean emailNotificationsEnabled = true;
        private String logoUrl;
        private String brandColor;
        private Map<String, Object> customSettings;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SecuritySettings {
        @Builder.Default
        private Boolean twoFactorRequired = false;
        @Builder.Default
        private Boolean ipWhitelistEnabled = false;
        private String[] allowedIPs;
        @Builder.Default
        private Integer sessionTimeoutMinutes = 480;  // 8 hours
        private Integer passwordExpiryDays;
        @Builder.Default
        private Boolean auditLogEnabled = true;
        @Builder.Default
        private Boolean encryptionEnabled = true;
    }

    public enum OrganizationStatus {
        TRIAL,
        ACTIVE,
        SUSPENDED,
        EXPIRED,
        CANCELLED
    }
}
