package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Leave;
import com.ultron.backend.domain.entity.User;
import com.ultron.backend.repository.LeaveRepository;
import com.ultron.backend.repository.ProfileRepository;
import com.ultron.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataNormalizationService implements CommandLineRunner {

    private final UserRepository userRepository;
    private final LeaveRepository leaveRepository;
    private final ProfileRepository profileRepository;

    @Override
    public void run(String... args) {
        log.info("Checking for data normalization requirements on startup...");
        try {
            normalizeData();
        } catch (Exception e) {
            log.error("Failed to execute data normalization on startup", e);
        }
    }

    /**
     * Normalizes all user and leave data to use MongoDB IDs for relationships.
     * Use this to repair data after migrating to MongoDB-ID based notifications.
     */
    @Transactional
    public String normalizeData() {
        log.info("Starting data normalization process...");
        int userCount = 0;
        int leaveCount = 0;

        // 1. Normalize Users
        List<User> users = userRepository.findAll();
        for (User user : users) {
            boolean updated = false;
            String managerId = user.getManagerId();

            if (managerId != null && (managerId.contains("@") || managerId.startsWith("USR-"))) {
                log.info("Normalizing managerId for user {}: {}", user.getUsername(), managerId);
                Optional<User> manager = findUserByAnyId(managerId, user.getTenantId());
                if (manager.isPresent()) {
                    user.setManagerId(manager.get().getId());
                    user.setManagerName(manager.get().getFullName() != null ? manager.get().getFullName() : manager.get().getUsername());
                    updated = true;
                }
            }

            if (updated) {
                userRepository.save(user);
                userCount++;
            }
        }

        // 2. Normalize Leaves
        List<Leave> leaves = leaveRepository.findAll();
        for (Leave leave : leaves) {
            boolean updated = false;
            
            // Normalize userId
            if (leave.getUserId() != null && (leave.getUserId().contains("@") || leave.getUserId().startsWith("USR-"))) {
                log.info("Normalizing userId for leave {}: {}", leave.getLeaveId(), leave.getUserId());
                Optional<User> owner = findUserByAnyId(leave.getUserId(), leave.getTenantId());
                if (owner.isPresent()) {
                    leave.setUserId(owner.get().getId());
                    updated = true;
                }
            }

            // Normalize approverId
            if (leave.getApproverId() != null && (leave.getApproverId().contains("@") || leave.getApproverId().startsWith("USR-"))) {
                log.info("Normalizing approverId for leave {}: {}", leave.getLeaveId(), leave.getApproverId());
                Optional<User> approver = findUserByAnyId(leave.getApproverId(), leave.getTenantId());
                if (approver.isPresent()) {
                    leave.setApproverId(approver.get().getId());
                    updated = true;
                }
            }

            if (updated) {
                leaveRepository.save(leave);
                leaveCount++;
            }
        }
        
        // 3. Normalize Profile Permissions (Add LOCATION if missing)
        List<com.ultron.backend.domain.entity.Profile> profiles = profileRepository.findAll();
        int profileCount = 0;
        for (com.ultron.backend.domain.entity.Profile profile : profiles) {
            boolean hasLocationPermission = false;
            if (profile.getObjectPermissions() != null) {
                hasLocationPermission = profile.getObjectPermissions().stream()
                        .anyMatch(op -> op.getObjectName().equalsIgnoreCase("LOCATION"));
            }

            if (!hasLocationPermission) {
                log.info("Adding missing LOCATION permission to profile: {}", profile.getProfileName());
                if (profile.getObjectPermissions() == null) {
                    profile.setObjectPermissions(new java.util.ArrayList<>());
                }
                
                com.ultron.backend.domain.entity.Profile.ObjectPermission locationPerm;
                String name = profile.getProfileName().toLowerCase();
                
                if (name.contains("admin") || name.contains("manager")) {
                    locationPerm = com.ultron.backend.domain.entity.Profile.ObjectPermission.builder()
                            .objectName("LOCATION")
                            .canCreate(true).canRead(true).canEdit(true).canDelete(true)
                            .canViewAll(true).canModifyAll(true)
                            .build();
                } else if (name.contains("representative") || name.contains("standard")) {
                    locationPerm = com.ultron.backend.domain.entity.Profile.ObjectPermission.builder()
                            .objectName("LOCATION")
                            .canCreate(true).canRead(true).canEdit(true).canDelete(true)
                            .canViewAll(false).canModifyAll(false)
                            .build();
                } else {
                    // Default to read-only for others
                    locationPerm = com.ultron.backend.domain.entity.Profile.ObjectPermission.builder()
                            .objectName("LOCATION")
                            .canCreate(false).canRead(true).canEdit(false).canDelete(false)
                            .canViewAll(false).canModifyAll(false)
                            .build();
                }
                
                profile.getObjectPermissions().add(locationPerm);
                profileRepository.save(profile);
                profileCount++;
            }
        }

        String result = String.format("Normalization complete. Updated %d users, %d leaves, and %d profiles.", userCount, leaveCount, profileCount);
        log.info(result);
        return result;
    }

    private Optional<User> findUserByAnyId(String id, String tenantId) {
        if (id == null) return Optional.empty();
        
        // Try internal ID first
        Optional<User> user = userRepository.findById(id);
        if (user.isPresent()) return user;

        // Try Business ID
        user = userRepository.findByUserIdAndTenantId(id, tenantId);
        if (user.isPresent()) return user;

        // Try Email
        user = userRepository.findByEmail(id);
        if (user.isPresent() && user.get().getTenantId().equals(tenantId)) return user;

        return Optional.empty();
    }
}
