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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
