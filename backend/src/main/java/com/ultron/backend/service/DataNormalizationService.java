package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Leave;
import com.ultron.backend.domain.entity.User;
import com.ultron.backend.repository.LeaveRepository;
import com.ultron.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataNormalizationService {

    private final UserRepository userRepository;
    private final LeaveRepository leaveRepository;

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

        String result = String.format("Normalization complete. Updated %d users and %d leaves.", userCount, leaveCount);
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
