package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Organization;
import com.ultron.backend.domain.entity.User;
import com.ultron.backend.domain.enums.UserRole;
import com.ultron.backend.domain.enums.UserStatus;
import com.ultron.backend.dto.request.LoginRequest;
import com.ultron.backend.dto.request.RegisterRequest;
import com.ultron.backend.dto.response.AuthResponse;
import com.ultron.backend.exception.InvalidCredentialsException;
import com.ultron.backend.exception.UserAlreadyExistsException;
import com.ultron.backend.exception.UserInactiveException;
import com.ultron.backend.repository.OrganizationRepository;
import com.ultron.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserService userService;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final SeedDataService seedDataService;
    private final UserIdGeneratorService userIdGeneratorService;
    private final UserActivityService userActivityService;

    /**
     * User registration (Legacy method - Pre-multi-tenancy)
     *
     * NOTE: For multi-tenant deployments, use OrganizationService.registerOrganization() instead.
     * This method is kept for backward compatibility and creates users without tenant context.
     *
     * @deprecated Use OrganizationService.registerOrganization() for new tenant onboarding
     */
    @Deprecated
    public AuthResponse register(RegisterRequest request) {
        log.info("Attempting to register user with email: {}", request.getEmail());
        log.warn("Using deprecated register method - consider using OrganizationService.registerOrganization() for multi-tenancy");

        if (userService.existsByEmail(request.getEmail())) {
            log.warn("Registration failed - email already exists: {}", request.getEmail());
            throw new UserAlreadyExistsException("Email already registered");
        }

        // Check if this is the first user (auto-assign admin)
        long userCount = userRepository.count();
        boolean isFirstUser = userCount == 0;

        if (isFirstUser) {
            log.info("First user registration detected - assigning System Administrator role and profile");
        }

        // Generate user ID
        String userId = userIdGeneratorService.generateUserId();

        // Parse full name into first/last name
        String[] nameParts = request.getFullName().trim().split(" ", 2);
        String firstName = nameParts[0];
        String lastName = nameParts.length > 1 ? nameParts[1] : "";

        // Build user profile
        User.UserProfile profile = User.UserProfile.builder()
                .firstName(firstName)
                .lastName(lastName)
                .fullName(request.getFullName())
                .build();

        // Build user settings with defaults
        User.UserSettings settings = User.UserSettings.builder()
                .timeZone("Asia/Kolkata")
                .language("en")
                .dateFormat("DD/MM/YYYY")
                .currency("INR")
                .emailNotifications(true)
                .desktopNotifications(true)
                .build();

        // Build user security
        User.UserSecurity security = User.UserSecurity.builder()
                .twoFactorEnabled(false)
                .failedLoginAttempts(0)
                .build();

        // Build user with RBAC fields
        User.UserBuilder userBuilder = User.builder()
                .userId(userId)
                .username(request.getEmail().split("@")[0]) // Use email prefix as username
                .email(request.getEmail().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .profile(profile)
                .settings(settings)
                .security(security)
                .passwordLastChanged(LocalDateTime.now())
                .passwordExpiresAt(LocalDateTime.now().plusDays(90))
                .status(UserStatus.ACTIVE)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy("SELF");

        // If first user, assign admin role and profile
        if (isFirstUser) {
            userBuilder
                    .roleId(seedDataService.getDefaultAdminRoleId())
                    .roleName("System Administrator")
                    .profileId(seedDataService.getDefaultAdminProfileId())
                    .profileName("System Administrator")
                    .role(UserRole.ADMIN); // Legacy field
        } else {
            // For subsequent users, use default USER role (admin must assign proper roles)
            userBuilder.role(UserRole.USER); // Legacy field
        }

        User user = userBuilder.build();
        User savedUser = userService.save(user);

        if (isFirstUser) {
            log.info("First user created as System Administrator: {}", savedUser.getUserId());
        } else {
            log.info("User registered successfully: {}", savedUser.getUserId());
        }

        String token = jwtService.generateToken(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole().name()
        );

        return buildAuthResponse(savedUser, token);
    }

    public AuthResponse login(LoginRequest request) {
        log.info("Attempting login for email: {}", request.getEmail());

        User user = userService.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> {
                    log.warn("Login failed - user not found: {}", request.getEmail());
                    return new InvalidCredentialsException("Invalid email or password");
                });

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Login failed - invalid password for email: {}", request.getEmail());
            // Log failed login attempt (with explicit tenantId since context not set during login)
            userActivityService.logLogin(user.getId(), user.getTenantId(), false);
            throw new InvalidCredentialsException("Invalid email or password");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            log.warn("Login failed - user account is not active: {}", request.getEmail());
            // Log failed login attempt (with explicit tenantId since context not set during login)
            userActivityService.logLogin(user.getId(), user.getTenantId(), false);
            throw new UserInactiveException("Your account is not active. Please contact support.");
        }

        // Multi-tenancy: Validate organization is active
        String tenantId = user.getTenantId();
        if (tenantId != null) {
            Organization organization = organizationRepository.findById(tenantId)
                    .orElse(null);

            if (organization == null) {
                log.error("Login failed - organization not found for user: {}", user.getEmail());
                throw new InvalidCredentialsException("Organization not found. Please contact support.");
            }

            if (organization.getStatus() == Organization.OrganizationStatus.SUSPENDED ||
                organization.getStatus() == Organization.OrganizationStatus.CANCELLED) {
                log.warn("Login failed - organization is {}: {}", organization.getStatus(), tenantId);
                throw new UserInactiveException("Your organization account is " + organization.getStatus().name().toLowerCase() + ". Please contact support.");
            }

            if (organization.getStatus() == Organization.OrganizationStatus.EXPIRED) {
                log.warn("Login failed - organization trial/subscription expired: {}", tenantId);
                throw new UserInactiveException("Your organization subscription has expired. Please renew to continue.");
            }
        }

        log.info("User logged in successfully: {} (tenant: {})", user.getId(), tenantId);

        // Log login activity (with explicit tenantId since context not set during login)
        userActivityService.logLogin(user.getId(), tenantId, true);

        // Generate JWT token with tenantId for multi-tenancy
        String token;
        if (tenantId != null) {
            token = jwtService.generateToken(
                    user.getId(),
                    user.getEmail(),
                    user.getRole().name(),
                    tenantId  // Include tenantId in JWT
            );
        } else {
            // Fallback for legacy users without tenantId - use DEFAULT tenant
            log.warn("User without tenantId attempting login: {} - using DEFAULT tenant", user.getEmail());
            token = jwtService.generateToken(
                    user.getId(),
                    user.getEmail(),
                    user.getRole().name(),
                    "DEFAULT"  // Default tenant for legacy users
            );
        }

        return buildAuthResponse(user, token);
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole()) // Legacy field
                .token(token)
                // Add RBAC fields to response (will update AuthResponse DTO later)
                .build();
    }
}
