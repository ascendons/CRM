package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.User;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.CurrentUserResponse;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import com.ultron.backend.dto.request.UpdateMyProfileRequest;
import com.ultron.backend.dto.request.ChangePasswordRequest;
import com.ultron.backend.dto.request.UpdateSettingsRequest;
import com.ultron.backend.dto.response.UserResponse;
import com.ultron.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Controller for current user operations (/me endpoint).
 * Returns information about the currently authenticated user.
 */
@RestController
@RequestMapping("/me")
@RequiredArgsConstructor
@Slf4j
public class MeController {

    private final UserRepository userRepository;
    private final UserService userService;

    /**
     * Get current user information including role and profile.
     * Used for dashboard display and UI personalization.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<CurrentUserResponse>> getCurrentUser(Authentication authentication) {
        String userId = authentication.getName(); // This is the MongoDB ID from JWT
        log.info("Fetching current user info for ID: {}", userId);
        log.info("Authentication object: {}", authentication);
        log.info("Authentication principal: {}", authentication.getPrincipal());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found with ID: {}", userId);
                    return new ResourceNotFoundException("User not found");
                });

        CurrentUserResponse response = CurrentUserResponse.builder()
                .id(user.getId())
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .firstName(user.getProfile() != null ? user.getProfile().getFirstName() : null)
                .lastName(user.getProfile() != null ? user.getProfile().getLastName() : null)
                .avatar(user.getProfile() != null ? user.getProfile().getAvatar() : null)
                .title(user.getProfile() != null ? user.getProfile().getTitle() : null)
                .department(user.getProfile() != null ? user.getProfile().getDepartment() : null)
                .userRole(user.getRole())  // Unified role enum
                .roleId(user.getRoleId())
                .roleName(user.getRoleName())
                .profileId(user.getProfileId())
                .profileName(user.getProfileName())
                .managerId(user.getManagerId())
                .managerName(user.getManagerName())
                .status(user.getStatus())
                .lastLoginAt(user.getSecurity() != null ? user.getSecurity().getLastLoginAt() : null)
                .build();

        return ResponseEntity.ok(ApiResponse.success("Current user fetched successfully", response));
    }

    /**
     * Update current user's profile information
     */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateMyProfile(
            @Valid @RequestBody UpdateMyProfileRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Updating profile for user: {}", userId);

        UserResponse response = userService.updateMyProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }

    /**
     * Change current user's password
     */
    @PutMapping("/security/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Changing password for user: {}", userId);

        userService.changePassword(userId, request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    /**
     * Update current user's settings
     */
    @PutMapping("/settings")
    public ResponseEntity<ApiResponse<UserResponse>> updateMySettings(
            @Valid @RequestBody UpdateSettingsRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Updating settings for user: {}", userId);

        UserResponse response = userService.updateMySettings(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Settings updated successfully", response));
    }
}
