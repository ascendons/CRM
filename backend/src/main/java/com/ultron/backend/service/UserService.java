package com.ultron.backend.service;

import com.ultron.backend.domain.entity.User;
import com.ultron.backend.domain.enums.UserStatus;
import com.ultron.backend.dto.request.CreateUserRequest;
import com.ultron.backend.dto.request.UpdateUserRequest;
import com.ultron.backend.dto.request.UpdateMyProfileRequest;
import com.ultron.backend.dto.request.ChangePasswordRequest;
import com.ultron.backend.dto.request.UpdateSettingsRequest;
import com.ultron.backend.dto.response.UserResponse;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.exception.UserAlreadyExistsException;
import com.ultron.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final UserIdGeneratorService userIdGeneratorService;
    private final PasswordEncoder passwordEncoder;

    // ==================== Legacy methods (for backward compatibility) ====================

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    public Optional<User> findById(String id) {
        return userRepository.findById(id);
    }

    public String getUserFullName(String userId) {
        return findById(userId)
                .map(user -> user.getProfile() != null ? user.getProfile().getFullName() : user.getFullName())
                .orElse("Unknown User");
    }

    // ==================== New User Management Methods ====================

    @Transactional
    public UserResponse createUser(CreateUserRequest request, String createdBy) {
        log.info("Creating new user with username: {}", request.getUsername());

        // Validate unique constraints
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException("Username already exists: " + request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already exists: " + request.getEmail());
        }

        // Generate user ID
        String userId = userIdGeneratorService.generateUserId();

        // Build full name
        String fullName = request.getFirstName() + " " + request.getLastName();

        // Hash password
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        // Build user profile
        User.UserProfile profile = User.UserProfile.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .fullName(fullName)
                .title(request.getTitle())
                .department(request.getDepartment())
                .phone(request.getPhone())
                .mobilePhone(request.getMobilePhone())
                .build();

        // Build user settings with defaults
        User.UserSettings settings = User.UserSettings.builder()
                .timeZone(request.getTimeZone() != null ? request.getTimeZone() : "Asia/Kolkata")
                .language(request.getLanguage() != null ? request.getLanguage() : "en")
                .dateFormat(request.getDateFormat() != null ? request.getDateFormat() : "DD/MM/YYYY")
                .currency(request.getCurrency() != null ? request.getCurrency() : "INR")
                .emailNotifications(request.getEmailNotifications() != null ? request.getEmailNotifications() : true)
                .desktopNotifications(request.getDesktopNotifications() != null ? request.getDesktopNotifications() : true)
                .build();

        // Build user security
        User.UserSecurity security = User.UserSecurity.builder()
                .twoFactorEnabled(false)
                .failedLoginAttempts(0)
                .build();

        // Build user entity
        User user = User.builder()
                .userId(userId)
                .username(request.getUsername())
                .email(request.getEmail())
                .password(hashedPassword)
                .passwordLastChanged(LocalDateTime.now())
                .passwordExpiresAt(LocalDateTime.now().plusDays(90))
                .profile(profile)
                .fullName(fullName)  // Legacy field
                .roleId(request.getRoleId())
                .profileId(request.getProfileId())
                .managerId(request.getManagerId())
                .teamId(request.getTeamId())
                .territoryId(request.getTerritoryId())
                .status(UserStatus.ACTIVE)
                .settings(settings)
                .security(security)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(createdBy)
                .build();

        // TODO: Fetch and set denormalized names (roleName, managerName, etc.)
        // This will be done when Role and Profile entities are created

        User savedUser = userRepository.save(user);
        log.info("User created successfully with userId: {}", savedUser.getUserId());

        // TODO: Log audit event when AuditService is available

        return mapToResponse(savedUser);
    }

    @Transactional
    public UserResponse updateUser(String id, UpdateUserRequest request, String modifiedBy) {
        log.info("Updating user with id: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // Update email if provided
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new UserAlreadyExistsException("Email already exists: " + request.getEmail());
            }
            user.setEmail(request.getEmail());
        }

        // Update profile fields
        if (user.getProfile() == null) {
            user.setProfile(new User.UserProfile());
        }

        boolean nameChanged = false;
        if (request.getFirstName() != null) {
            user.getProfile().setFirstName(request.getFirstName());
            nameChanged = true;
        }
        if (request.getLastName() != null) {
            user.getProfile().setLastName(request.getLastName());
            nameChanged = true;
        }

        // Recalculate full name if first or last name changed
        if (nameChanged && user.getProfile().getFirstName() != null && user.getProfile().getLastName() != null) {
            String fullName = user.getProfile().getFirstName() + " " + user.getProfile().getLastName();
            user.getProfile().setFullName(fullName);
            user.setFullName(fullName);  // Update legacy field
        }

        if (request.getTitle() != null) user.getProfile().setTitle(request.getTitle());
        if (request.getDepartment() != null) user.getProfile().setDepartment(request.getDepartment());
        if (request.getPhone() != null) user.getProfile().setPhone(request.getPhone());
        if (request.getMobilePhone() != null) user.getProfile().setMobilePhone(request.getMobilePhone());
        if (request.getAvatar() != null) user.getProfile().setAvatar(request.getAvatar());

        // Update access control
        if (request.getRoleId() != null) user.setRoleId(request.getRoleId());
        if (request.getProfileId() != null) user.setProfileId(request.getProfileId());
        if (request.getManagerId() != null) user.setManagerId(request.getManagerId());
        if (request.getTeamId() != null) user.setTeamId(request.getTeamId());
        if (request.getTerritoryId() != null) user.setTerritoryId(request.getTerritoryId());

        // Update settings
        if (user.getSettings() == null) {
            user.setSettings(new User.UserSettings());
        }
        if (request.getTimeZone() != null) user.getSettings().setTimeZone(request.getTimeZone());
        if (request.getLanguage() != null) user.getSettings().setLanguage(request.getLanguage());
        if (request.getDateFormat() != null) user.getSettings().setDateFormat(request.getDateFormat());
        if (request.getCurrency() != null) user.getSettings().setCurrency(request.getCurrency());
        if (request.getEmailNotifications() != null) user.getSettings().setEmailNotifications(request.getEmailNotifications());
        if (request.getDesktopNotifications() != null) user.getSettings().setDesktopNotifications(request.getDesktopNotifications());

        // Update audit fields
        user.setLastModifiedAt(LocalDateTime.now());
        user.setLastModifiedBy(modifiedBy);
        user.setUpdatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);
        log.info("User updated successfully with userId: {}", savedUser.getUserId());

        return mapToResponse(savedUser);
//        return mapToResponse(savedUser);
    }

    @Transactional
    public UserResponse updateMyProfile(String userId, UpdateMyProfileRequest request) {
        log.info("Updating profile for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getProfile() == null) {
            user.setProfile(new User.UserProfile());
        }

        boolean nameChanged = false;
        if (request.getFirstName() != null) {
            user.getProfile().setFirstName(request.getFirstName());
            nameChanged = true;
        }
        if (request.getLastName() != null) {
            user.getProfile().setLastName(request.getLastName());
            nameChanged = true;
        }

        // Recalculate full name if needed
        if (nameChanged) {
            String firstName = user.getProfile().getFirstName() != null ? user.getProfile().getFirstName() : "";
            String lastName = user.getProfile().getLastName() != null ? user.getProfile().getLastName() : "";
            String fullName = (firstName + " " + lastName).trim();
            
            if (fullName.isEmpty()) fullName = user.getUsername();
            
            user.getProfile().setFullName(fullName);
            user.setFullName(fullName);
        }

        if (request.getTitle() != null) user.getProfile().setTitle(request.getTitle());
        if (request.getDepartment() != null) user.getProfile().setDepartment(request.getDepartment());
        if (request.getPhone() != null) user.getProfile().setPhone(request.getPhone());
        if (request.getMobilePhone() != null) user.getProfile().setMobilePhone(request.getMobilePhone());
        if (request.getAvatar() != null) user.getProfile().setAvatar(request.getAvatar());

        user.setLastModifiedAt(LocalDateTime.now());
        user.setLastModifiedBy(userId);

        User savedUser = userRepository.save(user);
        return mapToResponse(savedUser);
    }

    @Transactional
    public void changePassword(String userId, String currentPassword, String newPassword) {
        log.info("Changing password for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Incorrect current password");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordLastChanged(LocalDateTime.now());
        user.setPasswordExpiresAt(LocalDateTime.now().plusDays(90));
        
        // Update audit fields
        user.setLastModifiedAt(LocalDateTime.now());
        user.setLastModifiedBy(userId);

        userRepository.save(user);
    }

    @Transactional
    public UserResponse updateMySettings(String userId, UpdateSettingsRequest request) {
        log.info("Updating settings for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getSettings() == null) {
            user.setSettings(new User.UserSettings());
        }

        if (request.getTimeZone() != null) user.getSettings().setTimeZone(request.getTimeZone());
        if (request.getLanguage() != null) user.getSettings().setLanguage(request.getLanguage());
        if (request.getDateFormat() != null) user.getSettings().setDateFormat(request.getDateFormat());
        if (request.getCurrency() != null) user.getSettings().setCurrency(request.getCurrency());
        if (request.getEmailNotifications() != null) user.getSettings().setEmailNotifications(request.getEmailNotifications());
        if (request.getDesktopNotifications() != null) user.getSettings().setDesktopNotifications(request.getDesktopNotifications());

        user.setLastModifiedAt(LocalDateTime.now());
        user.setLastModifiedBy(userId);

        User savedUser = userRepository.save(user);
        return mapToResponse(savedUser);
    }

    public UserResponse getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return mapToResponse(user);
    }

    public UserResponse getUserByUserId(String userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with userId: " + userId));
        return mapToResponse(user);
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findByIsDeletedFalse().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<UserResponse> getActiveUsers() {
        return userRepository.findByStatusAndIsDeletedFalse(UserStatus.ACTIVE).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<UserResponse> getUsersByRole(String roleId) {
        return userRepository.findByRoleIdAndIsDeletedFalse(roleId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<UserResponse> getSubordinates(String managerId) {
        return userRepository.findByManagerIdAndIsDeletedFalse(managerId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<UserResponse> searchUsers(String searchTerm) {
        return userRepository.searchUsers(searchTerm).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deactivateUser(String id, String deactivatedBy, String reason) {
        log.info("Deactivating user with id: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setStatus(UserStatus.INACTIVE);
        user.setIsDeleted(true);
        user.setDeletedAt(LocalDateTime.now());
        user.setDeletedBy(deactivatedBy);
        user.setDeactivationReason(reason);

        userRepository.save(user);
        log.info("User deactivated successfully with userId: {}", user.getUserId());

        // TODO: Log audit event when AuditService is available
    }

    @Transactional
    public void activateUser(String id, String activatedBy) {
        log.info("Activating user with id: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setStatus(UserStatus.ACTIVE);
        user.setIsDeleted(false);
        user.setDeletedAt(null);
        user.setDeletedBy(null);
        user.setDeactivationReason(null);
        user.setLastModifiedAt(LocalDateTime.now());
        user.setLastModifiedBy(activatedBy);

        userRepository.save(user);
        log.info("User activated successfully with userId: {}", user.getUserId());

        // TODO: Log audit event when AuditService is available
    }

    // ==================== Helper Methods ====================

    private UserResponse mapToResponse(User user) {
        UserResponse.UserProfileDTO profileDTO = null;
        if (user.getProfile() != null) {
            profileDTO = UserResponse.UserProfileDTO.builder()
                    .firstName(user.getProfile().getFirstName())
                    .lastName(user.getProfile().getLastName())
                    .fullName(user.getProfile().getFullName())
                    .title(user.getProfile().getTitle())
                    .department(user.getProfile().getDepartment())
                    .phone(user.getProfile().getPhone())
                    .mobilePhone(user.getProfile().getMobilePhone())
                    .avatar(user.getProfile().getAvatar())
                    .build();
        }

        UserResponse.UserSettingsDTO settingsDTO = null;
        if (user.getSettings() != null) {
            settingsDTO = UserResponse.UserSettingsDTO.builder()
                    .timeZone(user.getSettings().getTimeZone())
                    .language(user.getSettings().getLanguage())
                    .dateFormat(user.getSettings().getDateFormat())
                    .currency(user.getSettings().getCurrency())
                    .emailNotifications(user.getSettings().getEmailNotifications())
                    .desktopNotifications(user.getSettings().getDesktopNotifications())
                    .build();
        }

        UserResponse.UserSecurityDTO securityDTO = null;
        if (user.getSecurity() != null) {
            securityDTO = UserResponse.UserSecurityDTO.builder()
                    .twoFactorEnabled(user.getSecurity().getTwoFactorEnabled())
                    .allowedIPs(user.getSecurity().getAllowedIPs())
                    .lastLoginAt(user.getSecurity().getLastLoginAt())
                    .lastLoginIP(user.getSecurity().getLastLoginIP())
                    .failedLoginAttempts(user.getSecurity().getFailedLoginAttempts())
                    .lockedUntil(user.getSecurity().getLockedUntil())
                    .build();
        }

        return UserResponse.builder()
                .id(user.getId())
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .passwordLastChanged(user.getPasswordLastChanged())
                .passwordExpiresAt(user.getPasswordExpiresAt())
                .profile(profileDTO)
                .roleId(user.getRoleId())
                .roleName(user.getRoleName())
                .profileId(user.getProfileId())
                .profileName(user.getProfileName())
                .role(user.getRole())  // Legacy
                .status(user.getStatus())  // Legacy
                .managerId(user.getManagerId())
                .managerName(user.getManagerName())
                .teamId(user.getTeamId())
                .teamName(user.getTeamName())
                .territoryId(user.getTerritoryId())
                .territoryName(user.getTerritoryName())
                .settings(settingsDTO)
                .security(securityDTO)
                .isActive(user.getStatus() == UserStatus.ACTIVE)
                .isDeleted(user.getIsDeleted())
                .deletedAt(user.getDeletedAt())
                .deactivationReason(user.getDeactivationReason())
                .createdAt(user.getCreatedAt())
                .createdBy(user.getCreatedBy())
                .createdByName(user.getCreatedByName())
                .lastModifiedAt(user.getLastModifiedAt())
                .lastModifiedBy(user.getLastModifiedBy())
                .lastModifiedByName(user.getLastModifiedByName())
                .build();
    }
}

