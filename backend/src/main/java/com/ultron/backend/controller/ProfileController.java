package com.ultron.backend.controller;

import com.ultron.backend.dto.request.CreateProfileRequest;
import com.ultron.backend.dto.request.UpdateProfileRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.ProfileResponse;
import com.ultron.backend.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for profile management.
 * All endpoints require appropriate permissions checked via @PreAuthorize.
 */
@RestController
@RequestMapping("/profiles")
@RequiredArgsConstructor
@Slf4j
public class ProfileController {

    private final ProfileService profileService;

    @PostMapping
//    @PreAuthorize("hasPermission('PROFILE', 'CREATE')")
    public ResponseEntity<ApiResponse<ProfileResponse>> createProfile(
            @Valid @RequestBody CreateProfileRequest request,
            Authentication authentication) {
        log.info("Creating profile: {}", request.getProfileName());
        String createdBy = authentication.getName();
        ProfileResponse response = profileService.createProfile(request, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Profile created successfully", response));
    }

    @GetMapping
//    @PreAuthorize("hasPermission('PROFILE', 'READ')")
    public ResponseEntity<ApiResponse<List<ProfileResponse>>> getAllProfiles(
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly) {
        log.info("Fetching all profiles (activeOnly: {})", activeOnly);
        List<ProfileResponse> profiles = activeOnly ? profileService.getActiveProfiles() : profileService.getAllProfiles();
        return ResponseEntity.ok(ApiResponse.success("Profiles fetched successfully", profiles));
    }

    @GetMapping("/{id}")
//    @PreAuthorize("hasPermission('PROFILE', 'READ')")
    public ResponseEntity<ApiResponse<ProfileResponse>> getProfileById(@PathVariable String id) {
        log.info("Fetching profile by id: {}", id);
        ProfileResponse response = profileService.getProfileById(id);
        return ResponseEntity.ok(ApiResponse.success("Profile fetched successfully", response));
    }

    @GetMapping("/code/{profileId}")
//    @PreAuthorize("hasPermission('PROFILE', 'READ')")
    public ResponseEntity<ApiResponse<ProfileResponse>> getProfileByProfileId(@PathVariable String profileId) {
        log.info("Fetching profile by profileId: {}", profileId);
        ProfileResponse response = profileService.getProfileByProfileId(profileId);
        return ResponseEntity.ok(ApiResponse.success("Profile fetched successfully", response));
    }

    @GetMapping("/search")
//    @PreAuthorize("hasPermission('PROFILE', 'READ')")
    public ResponseEntity<ApiResponse<List<ProfileResponse>>> searchProfiles(
            @RequestParam String query) {
        log.info("Searching profiles with query: {}", query);
        List<ProfileResponse> profiles = profileService.searchProfiles(query);
        return ResponseEntity.ok(ApiResponse.success("Profiles search completed", profiles));
    }

    @PutMapping("/{id}")
//    @PreAuthorize("hasPermission('PROFILE', 'EDIT')")
    public ResponseEntity<ApiResponse<ProfileResponse>> updateProfile(
            @PathVariable String id,
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication) {
        log.info("Updating profile with id: {}", id);
        String modifiedBy = authentication.getName();
        ProfileResponse response = profileService.updateProfile(id, request, modifiedBy);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }

    @DeleteMapping("/{id}")
//    @PreAuthorize("hasPermission('PROFILE', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteProfile(
            @PathVariable String id,
            Authentication authentication) {
        log.info("Deleting profile with id: {}", id);
        String deletedBy = authentication.getName();
        profileService.deleteProfile(id, deletedBy);
        return ResponseEntity.ok(ApiResponse.success("Profile deleted successfully", null));
    }
}
