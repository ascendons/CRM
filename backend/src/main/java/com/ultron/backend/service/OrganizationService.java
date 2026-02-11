package com.ultron.backend.service;

import com.ultron.backend.domain.entity.LeadAssignmentConfig;
import com.ultron.backend.domain.entity.Organization;
import com.ultron.backend.domain.entity.Profile;
import com.ultron.backend.domain.entity.Role;
import com.ultron.backend.domain.entity.User;
import com.ultron.backend.domain.enums.UserRole;
import com.ultron.backend.domain.enums.UserStatus;
import com.ultron.backend.dto.request.OrganizationRegistrationRequest;
import com.ultron.backend.dto.response.OrganizationRegistrationResponse;
import com.ultron.backend.exception.BusinessException;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.LeadAssignmentConfigRepository;
import com.ultron.backend.repository.OrganizationRepository;
import com.ultron.backend.repository.ProfileRepository;
import com.ultron.backend.repository.RoleRepository;
import com.ultron.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Service for managing organizations (tenants)
 * Handles registration, subscription management, usage tracking, and limits
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ProfileRepository profileRepository;
    private final LeadAssignmentConfigRepository leadAssignmentConfigRepository;
    private final RoleMigrationService roleMigrationService;
    private final ProfileMigrationService profileMigrationService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OrganizationIdGeneratorService organizationIdGenerator;
    private final UserIdGeneratorService userIdGenerator;

    /**
     * Complete organization onboarding:
     * 1. Create Organization (tenant)
     * 2. Create first admin user for that organization
     * 3. Generate JWT token for immediate login
     */
    @Transactional
    public OrganizationRegistrationResponse registerOrganization(OrganizationRegistrationRequest request) {
        log.info("Starting organization registration: {}", request.getOrganizationName());

        // 1. Validate uniqueness
        if (organizationRepository.existsBySubdomain(request.getSubdomain())) {
            throw new BusinessException("Subdomain already taken: " + request.getSubdomain());
        }

        if (userRepository.existsByEmail(request.getAdminEmail())) {
            throw new BusinessException("Email already registered: " + request.getAdminEmail());
        }

        // 2. Create Organization
        Organization organization = Organization.builder()
                .organizationId(organizationIdGenerator.generateOrganizationId())
                .subdomain(request.getSubdomain())
                .organizationName(request.getOrganizationName())
                .displayName(request.getOrganizationName())
                .primaryEmail(request.getAdminEmail())
                .industry(request.getIndustry())
                .companySize(request.getCompanySize())
                .country(request.getCountry())
                .status(Organization.OrganizationStatus.TRIAL)
                .subscription(createSubscriptionInfo(request.getSubscriptionTier()))
                .limits(getDefaultLimits(request.getSubscriptionTier()))
                .usage(createInitialUsage())
                .settings(createDefaultSettings())
                .security(createDefaultSecurity())
                .createdAt(LocalDateTime.now())
                .isDeleted(false)
                .build();

        Organization savedOrg = organizationRepository.save(organization);
        log.info("Created organization: {} (tenantId: {})", savedOrg.getOrganizationName(), savedOrg.getId());

        // 2.5. Seed default roles and profiles for this tenant
        log.info("Seeding default roles and profiles for tenant: {}", savedOrg.getId());
        roleMigrationService.seedDefaultRolesForTenant(savedOrg.getId());
        profileMigrationService.seedDefaultProfilesForTenant(savedOrg.getId());

        // Get the admin role and profile for this tenant (created above)
        Role adminRole = roleRepository.findByRoleNameAndTenantId("System Administrator", savedOrg.getId())
                .orElseThrow(() -> new RuntimeException("Admin role not found after seeding"));
        Profile adminProfile = profileRepository.findByProfileNameAndTenantId("System Administrator", savedOrg.getId())
                .orElseThrow(() -> new RuntimeException("Admin profile not found after seeding"));

        log.info("Retrieved admin role: {} and profile: {} for tenant", adminRole.getRoleId(), adminProfile.getProfileId());

        // 2.6. Create default lead assignment configuration (disabled by default)
        log.info("Creating default lead assignment config for tenant: {}", savedOrg.getId());
        LeadAssignmentConfig defaultConfig = LeadAssignmentConfig.builder()
                .tenantId(savedOrg.getId())
                .enabled(false)  // Disabled by default - admin must configure
                .strategy(LeadAssignmentConfig.AssignmentStrategy.ROUND_ROBIN)
                .eligibleRoleIds(java.util.Collections.emptyList())  // No roles configured yet
                .lastAssignedIndex(0)
                .createdAt(LocalDateTime.now())
                .lastModifiedAt(LocalDateTime.now())
                .build();
        leadAssignmentConfigRepository.save(defaultConfig);
        log.info("Created default lead assignment config for tenant: {}", savedOrg.getId());

        // 3. Create first admin user
        User adminUser = User.builder()
                .userId(userIdGenerator.generateUserId())
                .tenantId(savedOrg.getId())  // Link to organization
                .username(request.getAdminEmail())
                .email(request.getAdminEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getAdminName())
                .profile(User.UserProfile.builder()
                        .fullName(request.getAdminName())
                        .build())
                .role(UserRole.ADMIN)  // Legacy enum, kept for backward compatibility
                .roleId(adminRole.getRoleId())  // Dynamic role ID from database
                .roleName(adminRole.getRoleName())  // Dynamic role name
                .profileId(adminProfile.getProfileId())  // Dynamic profile ID from database
                .userType("TENANT_ADMIN")
                .status(UserStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .isDeleted(false)
                .build();

        User savedUser = userRepository.save(adminUser);
        log.info("Created admin user: {} for organization: {}", savedUser.getEmail(), savedOrg.getOrganizationName());

        // 4. Generate JWT token for immediate login (with dynamic role/profile IDs)
        String token = jwtService.generateToken(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole().name(),  // Legacy enum
                savedUser.getRoleId(),       // Dynamic role ID from database
                savedUser.getProfileId(),    // Dynamic profile ID from database
                savedOrg.getId()              // Include tenantId in token
        );

        // 5. Calculate trial days remaining
        Integer trialDays = null;
        if (savedOrg.getSubscription() != null && savedOrg.getSubscription().getTrialEndDate() != null) {
            trialDays = (int) ChronoUnit.DAYS.between(LocalDateTime.now(), savedOrg.getSubscription().getTrialEndDate());
        }

        return OrganizationRegistrationResponse.builder()
                .organizationId(savedOrg.getOrganizationId())
                .tenantId(savedOrg.getId())
                .subdomain(savedOrg.getSubdomain())
                .organizationName(savedOrg.getOrganizationName())
                .userId(savedUser.getId())
                .userEmail(savedUser.getEmail())
                .token(token)
                .subscriptionTier(request.getSubscriptionTier())
                .trialDaysRemaining(trialDays)
                .message("Organization created successfully. Trial period: 14 days")
                .build();
    }

    /**
     * Validate resource limit before creation
     * @param tenantId Organization ID
     * @param resourceType Type of resource (leads, contacts, users, etc.)
     * @throws BusinessException if limit exceeded
     */
    public void validateResourceLimit(String tenantId, String resourceType) {
        Organization org = organizationRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        Organization.UsageLimits limits = org.getLimits();
        Organization.UsageMetrics usage = org.getUsage();

        if (limits == null || usage == null) {
            return; // No limits configured
        }

        boolean limitExceeded = false;
        String errorMessage = "";

        switch (resourceType.toLowerCase()) {
            case "leads":
                if (limits.getMaxLeads() != null && usage.getCurrentLeads() != null &&
                    usage.getCurrentLeads() >= limits.getMaxLeads()) {
                    limitExceeded = true;
                    errorMessage = "Lead limit reached (" + limits.getMaxLeads() + "). Upgrade your plan to add more leads.";
                }
                break;
            case "contacts":
                if (limits.getMaxContacts() != null && usage.getCurrentContacts() != null &&
                    usage.getCurrentContacts() >= limits.getMaxContacts()) {
                    limitExceeded = true;
                    errorMessage = "Contact limit reached (" + limits.getMaxContacts() + "). Upgrade your plan.";
                }
                break;
            case "users":
                if (limits.getMaxUsers() != null && usage.getCurrentUsers() != null &&
                    usage.getCurrentUsers() >= limits.getMaxUsers()) {
                    limitExceeded = true;
                    errorMessage = "User limit reached (" + limits.getMaxUsers() + "). Upgrade your plan.";
                }
                break;
            case "accounts":
                if (limits.getMaxAccounts() != null && usage.getCurrentAccounts() != null &&
                    usage.getCurrentAccounts() >= limits.getMaxAccounts()) {
                    limitExceeded = true;
                    errorMessage = "Account limit reached (" + limits.getMaxAccounts() + "). Upgrade your plan.";
                }
                break;
            case "opportunities":
                if (limits.getMaxOpportunities() != null && usage.getCurrentOpportunities() != null &&
                    usage.getCurrentOpportunities() >= limits.getMaxOpportunities()) {
                    limitExceeded = true;
                    errorMessage = "Opportunity limit reached (" + limits.getMaxOpportunities() + "). Upgrade your plan.";
                }
                break;
        }

        if (limitExceeded) {
            log.warn("Resource limit exceeded for tenant {}: {}", tenantId, errorMessage);
            throw new BusinessException(errorMessage);
        }
    }

    /**
     * Increment usage counter for a resource type
     * @param tenantId Organization ID
     * @param resourceType Type of resource
     */
    public void incrementUsage(String tenantId, String resourceType) {
        Organization org = organizationRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        Organization.UsageMetrics usage = org.getUsage();
        if (usage == null) {
            usage = createInitialUsage();
        }

        switch (resourceType.toLowerCase()) {
            case "leads":
                usage.setCurrentLeads((usage.getCurrentLeads() != null ? usage.getCurrentLeads() : 0) + 1);
                break;
            case "contacts":
                usage.setCurrentContacts((usage.getCurrentContacts() != null ? usage.getCurrentContacts() : 0) + 1);
                break;
            case "users":
                usage.setCurrentUsers((usage.getCurrentUsers() != null ? usage.getCurrentUsers() : 0) + 1);
                break;
            case "accounts":
                usage.setCurrentAccounts((usage.getCurrentAccounts() != null ? usage.getCurrentAccounts() : 0) + 1);
                break;
            case "opportunities":
                usage.setCurrentOpportunities((usage.getCurrentOpportunities() != null ? usage.getCurrentOpportunities() : 0) + 1);
                break;
            case "products":
                usage.setCurrentProducts((usage.getCurrentProducts() != null ? usage.getCurrentProducts() : 0) + 1);
                break;
        }

        usage.setLastCalculated(LocalDateTime.now());
        org.setUsage(usage);
        organizationRepository.save(org);

        log.debug("Incremented usage for tenant {}: {} = {}", tenantId, resourceType, usage);
    }

    /**
     * Decrement usage counter for a resource type (when deleted)
     */
    public void decrementUsage(String tenantId, String resourceType) {
        Organization org = organizationRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        Organization.UsageMetrics usage = org.getUsage();
        if (usage == null) {
            return;
        }

        switch (resourceType.toLowerCase()) {
            case "leads":
                usage.setCurrentLeads(Math.max(0, (usage.getCurrentLeads() != null ? usage.getCurrentLeads() : 0) - 1));
                break;
            case "contacts":
                usage.setCurrentContacts(Math.max(0, (usage.getCurrentContacts() != null ? usage.getCurrentContacts() : 0) - 1));
                break;
            case "users":
                usage.setCurrentUsers(Math.max(0, (usage.getCurrentUsers() != null ? usage.getCurrentUsers() : 0) - 1));
                break;
            case "accounts":
                usage.setCurrentAccounts(Math.max(0, (usage.getCurrentAccounts() != null ? usage.getCurrentAccounts() : 0) - 1));
                break;
            case "opportunities":
                usage.setCurrentOpportunities(Math.max(0, (usage.getCurrentOpportunities() != null ? usage.getCurrentOpportunities() : 0) - 1));
                break;
        }

        usage.setLastCalculated(LocalDateTime.now());
        org.setUsage(usage);
        organizationRepository.save(org);
    }

    // Helper methods

    /**
     * Get user by ID (used by OrganizationController to find user's tenantId)
     */
    public User getUserById(String userId) {
        return userRepository.findById(userId).orElse(null);
    }

    private Organization.SubscriptionInfo createSubscriptionInfo(String tier) {
        LocalDateTime now = LocalDateTime.now();
        return Organization.SubscriptionInfo.builder()
                .planType(tier != null ? tier : "FREE")
                .startDate(now)
                .trialEndDate(now.plusDays(14))  // 14-day trial
                .billingCycle("MONTHLY")
                .paymentStatus("TRIAL")
                .build();
    }

    private Organization.UsageLimits getDefaultLimits(String tier) {
        return switch (tier != null ? tier : "FREE") {
            case "STARTER" -> Organization.UsageLimits.builder()
                    .maxUsers(5)
                    .maxLeads(1000)
                    .maxContacts(5000)
                    .maxAccounts(500)
                    .maxOpportunities(500)
                    .maxProducts(100)
                    .maxStorageMB(10240L)  // 10 GB
                    .maxApiCallsPerDay(10000)
                    .customFieldsEnabled(false)
                    .apiAccessEnabled(false)
                    .advancedReportsEnabled(false)
                    .build();
            case "PROFESSIONAL" -> Organization.UsageLimits.builder()
                    .maxUsers(20)
                    .maxLeads(10000)
                    .maxContacts(50000)
                    .maxAccounts(5000)
                    .maxOpportunities(5000)
                    .maxProducts(1000)
                    .maxStorageMB(102400L)  // 100 GB
                    .maxApiCallsPerDay(100000)
                    .customFieldsEnabled(true)
                    .apiAccessEnabled(true)
                    .advancedReportsEnabled(true)
                    .build();
            case "ENTERPRISE" -> Organization.UsageLimits.builder()
                    .maxUsers(999999)
                    .maxLeads(999999)
                    .maxContacts(999999)
                    .maxAccounts(999999)
                    .maxOpportunities(999999)
                    .maxProducts(999999)
                    .maxStorageMB(9999999L)
                    .maxApiCallsPerDay(999999)
                    .customFieldsEnabled(true)
                    .apiAccessEnabled(true)
                    .advancedReportsEnabled(true)
                    .build();
            default -> Organization.UsageLimits.builder()  // FREE tier
                    .maxUsers(2)
                    .maxLeads(100)
                    .maxContacts(500)
                    .maxAccounts(50)
                    .maxOpportunities(50)
                    .maxProducts(20)
                    .maxStorageMB(1024L)  // 1 GB
                    .maxApiCallsPerDay(1000)
                    .customFieldsEnabled(false)
                    .apiAccessEnabled(false)
                    .advancedReportsEnabled(false)
                    .build();
        };
    }

    private Organization.UsageMetrics createInitialUsage() {
        return Organization.UsageMetrics.builder()
                .currentUsers(0)
                .currentLeads(0)
                .currentContacts(0)
                .currentAccounts(0)
                .currentOpportunities(0)
                .currentProducts(0)
                .currentStorageMB(0L)
                .apiCallsToday(0)
                .lastCalculated(LocalDateTime.now())
                .build();
    }

    private Organization.OrganizationSettings createDefaultSettings() {
        return Organization.OrganizationSettings.builder()
                .dateFormat("DD/MM/YYYY")
                .timeFormat("HH:mm")
                .language("en")
                .emailNotificationsEnabled(true)
                .build();
    }

    private Organization.SecuritySettings createDefaultSecurity() {
        return Organization.SecuritySettings.builder()
                .twoFactorRequired(false)
                .ipWhitelistEnabled(false)
                .sessionTimeoutMinutes(480)  // 8 hours
                .auditLogEnabled(true)
                .encryptionEnabled(true)
                .build();
    }
}
