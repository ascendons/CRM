package com.ultron.backend.service;

import com.ultron.backend.constants.PredefinedProfiles;
import com.ultron.backend.domain.entity.Profile;
import com.ultron.backend.dto.request.CreateProfileRequest;
import com.ultron.backend.dto.request.UpdateProfileRequest;
import com.ultron.backend.dto.response.ProfileResponse;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.exception.UserAlreadyExistsException;
import com.ultron.backend.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final ProfileIdGeneratorService profileIdGeneratorService;

    @Transactional
    public ProfileResponse createProfile(CreateProfileRequest request, String createdBy) {
        log.info("Creating new profile: {}", request.getProfileName());

        // Validate unique name
        if (profileRepository.existsByProfileName(request.getProfileName())) {
            throw new UserAlreadyExistsException("Profile name already exists: " + request.getProfileName());
        }

        // Generate profile ID
        String profileId = profileIdGeneratorService.generateProfileId();

        // Build profile entity
        Profile profile = Profile.builder()
                .profileId(profileId)
                .profileName(request.getProfileName())
                .description(request.getDescription())
                .objectPermissions(buildObjectPermissions(request.getObjectPermissions()))
                .fieldPermissions(buildFieldPermissions(request.getFieldPermissions()))
                .systemPermissions(buildSystemPermissions(request.getSystemPermissions()))
                .isActive(true)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(createdBy)
                .build();

        Profile savedProfile = profileRepository.save(profile);
        log.info("Profile created successfully with profileId: {}", savedProfile.getProfileId());
        return mapToResponse(savedProfile);
    }

    @Transactional
    public ProfileResponse updateProfile(String id, UpdateProfileRequest request, String modifiedBy) {
        log.info("Updating profile with id: {}", id);

        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found with id: " + id));

        // Update name if changed
        if (request.getProfileName() != null && !request.getProfileName().equals(profile.getProfileName())) {
            if (profileRepository.existsByProfileName(request.getProfileName())) {
                throw new UserAlreadyExistsException("Profile name already exists: " + request.getProfileName());
            }
            profile.setProfileName(request.getProfileName());
        }

        if (request.getDescription() != null) {
            profile.setDescription(request.getDescription());
        }

        // Update permissions
        if (request.getObjectPermissions() != null) {
            profile.setObjectPermissions(buildObjectPermissions(request.getObjectPermissions()));
        }
        if (request.getFieldPermissions() != null) {
            profile.setFieldPermissions(buildFieldPermissions(request.getFieldPermissions()));
        }
        if (request.getSystemPermissions() != null) {
            profile.setSystemPermissions(buildSystemPermissions(request.getSystemPermissions()));
        }

        profile.setLastModifiedAt(LocalDateTime.now());
        profile.setLastModifiedBy(modifiedBy);

        Profile savedProfile = profileRepository.save(profile);
        log.info("Profile updated successfully with profileId: {}", savedProfile.getProfileId());
        return mapToResponse(savedProfile);
    }

    public ProfileResponse getProfileById(String id) {
        // Use predefined profiles instead of database
        Profile profile = PredefinedProfiles.getProfileById(id);
        if (profile == null) {
            throw new ResourceNotFoundException("Profile not found with id: " + id);
        }
        return mapToResponse(profile);
    }

    public ProfileResponse getProfileByProfileId(String profileId) {
        // Use predefined profiles instead of database
        Profile profile = PredefinedProfiles.getProfileById(profileId);
        if (profile == null) {
            throw new ResourceNotFoundException("Profile not found with profileId: " + profileId);
        }
        return mapToResponse(profile);
    }

    public List<ProfileResponse> getAllProfiles() {
        // Use predefined profiles instead of database
        return PredefinedProfiles.getAllProfiles().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ProfileResponse> getActiveProfiles() {
        // Use predefined profiles instead of database
        return PredefinedProfiles.getActiveProfiles().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ProfileResponse> searchProfiles(String searchTerm) {
        // Use predefined profiles instead of database
        return PredefinedProfiles.searchProfiles(searchTerm).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteProfile(String id, String deletedBy) {
        log.info("Deleting profile with id: {}", id);

        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found with id: " + id));

        // Soft delete
        profile.setIsDeleted(true);
        profile.setDeletedAt(LocalDateTime.now());
        profile.setDeletedBy(deletedBy);

        profileRepository.save(profile);
        log.info("Profile deleted successfully with profileId: {}", profile.getProfileId());
    }

    // Helper methods for building permissions
    private List<Profile.ObjectPermission> buildObjectPermissions(List<?> dtos) {
        if (dtos == null) return null;

        return dtos.stream().map(dto -> {
            if (dto instanceof CreateProfileRequest.ObjectPermissionDTO) {
                CreateProfileRequest.ObjectPermissionDTO d = (CreateProfileRequest.ObjectPermissionDTO) dto;
                return Profile.ObjectPermission.builder()
                        .objectName(d.getObjectName())
                        .canCreate(d.getCanCreate() != null ? d.getCanCreate() : false)
                        .canRead(d.getCanRead() != null ? d.getCanRead() : false)
                        .canEdit(d.getCanEdit() != null ? d.getCanEdit() : false)
                        .canDelete(d.getCanDelete() != null ? d.getCanDelete() : false)
                        .canViewAll(d.getCanViewAll() != null ? d.getCanViewAll() : false)
                        .canModifyAll(d.getCanModifyAll() != null ? d.getCanModifyAll() : false)
                        .build();
            } else if (dto instanceof UpdateProfileRequest.ObjectPermissionDTO) {
                UpdateProfileRequest.ObjectPermissionDTO d = (UpdateProfileRequest.ObjectPermissionDTO) dto;
                return Profile.ObjectPermission.builder()
                        .objectName(d.getObjectName())
                        .canCreate(d.getCanCreate())
                        .canRead(d.getCanRead())
                        .canEdit(d.getCanEdit())
                        .canDelete(d.getCanDelete())
                        .canViewAll(d.getCanViewAll())
                        .canModifyAll(d.getCanModifyAll())
                        .build();
            }
            return null;
        }).collect(Collectors.toList());
    }

    private List<Profile.FieldPermission> buildFieldPermissions(List<?> dtos) {
        if (dtos == null) return null;

        return dtos.stream().map(dto -> {
            if (dto instanceof CreateProfileRequest.FieldPermissionDTO) {
                CreateProfileRequest.FieldPermissionDTO d = (CreateProfileRequest.FieldPermissionDTO) dto;
                return Profile.FieldPermission.builder()
                        .objectName(d.getObjectName())
                        .fieldName(d.getFieldName())
                        .canRead(d.getCanRead() != null ? d.getCanRead() : true)
                        .canEdit(d.getCanEdit() != null ? d.getCanEdit() : true)
                        .isHidden(d.getIsHidden() != null ? d.getIsHidden() : false)
                        .isEncrypted(d.getIsEncrypted() != null ? d.getIsEncrypted() : false)
                        .build();
            } else if (dto instanceof UpdateProfileRequest.FieldPermissionDTO) {
                UpdateProfileRequest.FieldPermissionDTO d = (UpdateProfileRequest.FieldPermissionDTO) dto;
                return Profile.FieldPermission.builder()
                        .objectName(d.getObjectName())
                        .fieldName(d.getFieldName())
                        .canRead(d.getCanRead())
                        .canEdit(d.getCanEdit())
                        .isHidden(d.getIsHidden())
                        .isEncrypted(d.getIsEncrypted())
                        .build();
            }
            return null;
        }).collect(Collectors.toList());
    }

    private Profile.SystemPermissions buildSystemPermissions(Object dto) {
        if (dto == null) {
            return Profile.SystemPermissions.builder()
                    .canAccessAPI(true)
                    .apiRateLimit(1000)
                    .canAccessMobileApp(true)
                    .canAccessReports(true)
                    .canAccessDashboards(true)
                    .canBulkUpdate(false)
                    .canBulkDelete(false)
                    .canMassEmail(false)
                    .canBypassValidation(false)
                    .canRunApex(false)
                    .build();
        }

        if (dto instanceof CreateProfileRequest.SystemPermissionsDTO) {
            CreateProfileRequest.SystemPermissionsDTO d = (CreateProfileRequest.SystemPermissionsDTO) dto;
            return Profile.SystemPermissions.builder()
                    .canAccessAPI(d.getCanAccessAPI() != null ? d.getCanAccessAPI() : true)
                    .apiRateLimit(d.getApiRateLimit() != null ? d.getApiRateLimit() : 1000)
                    .canAccessMobileApp(d.getCanAccessMobileApp() != null ? d.getCanAccessMobileApp() : true)
                    .canAccessReports(d.getCanAccessReports() != null ? d.getCanAccessReports() : true)
                    .canAccessDashboards(d.getCanAccessDashboards() != null ? d.getCanAccessDashboards() : true)
                    .canBulkUpdate(d.getCanBulkUpdate() != null ? d.getCanBulkUpdate() : false)
                    .canBulkDelete(d.getCanBulkDelete() != null ? d.getCanBulkDelete() : false)
                    .canMassEmail(d.getCanMassEmail() != null ? d.getCanMassEmail() : false)
                    .canBypassValidation(d.getCanBypassValidation() != null ? d.getCanBypassValidation() : false)
                    .canRunApex(d.getCanRunApex() != null ? d.getCanRunApex() : false)
                    .build();
        } else if (dto instanceof UpdateProfileRequest.SystemPermissionsDTO) {
            UpdateProfileRequest.SystemPermissionsDTO d = (UpdateProfileRequest.SystemPermissionsDTO) dto;
            return Profile.SystemPermissions.builder()
                    .canAccessAPI(d.getCanAccessAPI())
                    .apiRateLimit(d.getApiRateLimit())
                    .canAccessMobileApp(d.getCanAccessMobileApp())
                    .canAccessReports(d.getCanAccessReports())
                    .canAccessDashboards(d.getCanAccessDashboards())
                    .canBulkUpdate(d.getCanBulkUpdate())
                    .canBulkDelete(d.getCanBulkDelete())
                    .canMassEmail(d.getCanMassEmail())
                    .canBypassValidation(d.getCanBypassValidation())
                    .canRunApex(d.getCanRunApex())
                    .build();
        }

        return null;
    }

    private ProfileResponse mapToResponse(Profile profile) {
        List<ProfileResponse.ObjectPermissionDTO> objectPerms = null;
        if (profile.getObjectPermissions() != null) {
            objectPerms = profile.getObjectPermissions().stream()
                    .map(op -> ProfileResponse.ObjectPermissionDTO.builder()
                            .objectName(op.getObjectName())
                            .canCreate(op.getCanCreate())
                            .canRead(op.getCanRead())
                            .canEdit(op.getCanEdit())
                            .canDelete(op.getCanDelete())
                            .canViewAll(op.getCanViewAll())
                            .canModifyAll(op.getCanModifyAll())
                            .build())
                    .collect(Collectors.toList());
        }

        List<ProfileResponse.FieldPermissionDTO> fieldPerms = null;
        if (profile.getFieldPermissions() != null) {
            fieldPerms = profile.getFieldPermissions().stream()
                    .map(fp -> ProfileResponse.FieldPermissionDTO.builder()
                            .objectName(fp.getObjectName())
                            .fieldName(fp.getFieldName())
                            .canRead(fp.getCanRead())
                            .canEdit(fp.getCanEdit())
                            .isHidden(fp.getIsHidden())
                            .isEncrypted(fp.getIsEncrypted())
                            .build())
                    .collect(Collectors.toList());
        }

        ProfileResponse.SystemPermissionsDTO systemPerms = null;
        if (profile.getSystemPermissions() != null) {
            systemPerms = ProfileResponse.SystemPermissionsDTO.builder()
                    .canAccessAPI(profile.getSystemPermissions().getCanAccessAPI())
                    .apiRateLimit(profile.getSystemPermissions().getApiRateLimit())
                    .canAccessMobileApp(profile.getSystemPermissions().getCanAccessMobileApp())
                    .canAccessReports(profile.getSystemPermissions().getCanAccessReports())
                    .canAccessDashboards(profile.getSystemPermissions().getCanAccessDashboards())
                    .canBulkUpdate(profile.getSystemPermissions().getCanBulkUpdate())
                    .canBulkDelete(profile.getSystemPermissions().getCanBulkDelete())
                    .canMassEmail(profile.getSystemPermissions().getCanMassEmail())
                    .canBypassValidation(profile.getSystemPermissions().getCanBypassValidation())
                    .canRunApex(profile.getSystemPermissions().getCanRunApex())
                    .build();
        }

        return ProfileResponse.builder()
                .id(profile.getId())
                .profileId(profile.getProfileId())
                .profileName(profile.getProfileName())
                .description(profile.getDescription())
                .objectPermissions(objectPerms)
                .fieldPermissions(fieldPerms)
                .systemPermissions(systemPerms)
                .isActive(profile.getIsActive())
                .isDeleted(profile.getIsDeleted())
                .createdAt(profile.getCreatedAt())
                .createdBy(profile.getCreatedBy())
                .createdByName(profile.getCreatedByName())
                .lastModifiedAt(profile.getLastModifiedAt())
                .lastModifiedBy(profile.getLastModifiedBy())
                .lastModifiedByName(profile.getLastModifiedByName())
                .build();
    }
}
