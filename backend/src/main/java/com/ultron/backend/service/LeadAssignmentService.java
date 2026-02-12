package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Lead;
import com.ultron.backend.domain.entity.LeadAssignmentConfig;
import com.ultron.backend.domain.entity.User;
import com.ultron.backend.domain.enums.UserStatus;
import com.ultron.backend.dto.response.LeadResponse;
import com.ultron.backend.exception.BusinessException;
import com.ultron.backend.multitenancy.TenantContext;
import com.ultron.backend.domain.entity.Role;
import com.ultron.backend.repository.LeadAssignmentConfigRepository;
import com.ultron.backend.repository.LeadRepository;
import com.ultron.backend.repository.RoleRepository;
import com.ultron.backend.repository.UserRepository;
import com.ultron.backend.strategy.LeadAssignmentStrategy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Service for automatic and manual lead assignment
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LeadAssignmentService {

    private final LeadAssignmentConfigRepository configRepository;
    private final UserRepository userRepository;
    private final LeadRepository leadRepository;
    private final RoleRepository roleRepository;
    private final Map<String, LeadAssignmentStrategy> assignmentStrategies;

    /**
     * Auto-assign a lead to an eligible user
     * Called when a new lead is created
     */
    @Transactional
    public void autoAssignLead(Lead lead) {
        String tenantId = TenantContext.getTenantId();
        log.info("[Tenant: {}] Auto-assigning lead: {}", tenantId, lead.getId());

        // Get assignment configuration
        LeadAssignmentConfig config = configRepository.findByTenantId(tenantId)
                .orElse(null);

        // Auto-configure if config is missing or has no eligible roles
        if (config == null || config.getEligibleRoleIds() == null || config.getEligibleRoleIds().isEmpty()) {
            List<String> eligibleRoleIds = roleRepository.findByTenantIdAndIsDeletedFalse(tenantId)
                    .stream()
                    .filter(r -> !"Read-Only User".equals(r.getRoleName()))
                    .map(Role::getRoleId)
                    .collect(java.util.stream.Collectors.toList());

            if (eligibleRoleIds.isEmpty()) {
                log.warn("No roles found for tenant: {}", tenantId);
                return;
            }

            if (config == null) {
                config = LeadAssignmentConfig.builder()
                        .tenantId(tenantId)
                        .enabled(true)
                        .strategy(LeadAssignmentConfig.AssignmentStrategy.ROUND_ROBIN)
                        .eligibleRoleIds(eligibleRoleIds)
                        .createdAt(LocalDateTime.now())
                        .build();
            } else {
                config.setEligibleRoleIds(eligibleRoleIds);
                config.setEnabled(true);
                config.setLastModifiedAt(LocalDateTime.now());
            }
            configRepository.save(config);
            log.info("[Tenant: {}] Auto-configured lead assignment with {} eligible roles", tenantId, eligibleRoleIds.size());
        }

        // Check if auto-assignment is enabled
        if (!Boolean.TRUE.equals(config.getEnabled())) {
            log.info("Auto-assignment disabled for tenant: {}", tenantId);
            return;
        }

        // Get eligible users
        List<User> eligibleUsers = getEligibleUsers(config.getEligibleRoleIds(), tenantId);

        if (eligibleUsers.isEmpty()) {
            log.warn("No eligible users found for assignment in tenant: {}", tenantId);
            return;
        }

        // Select strategy
        LeadAssignmentStrategy strategy = getStrategy(config.getStrategy());

        // Assign user
        User selectedUser = strategy.selectUser(eligibleUsers, config.getLastAssignedIndex());

        // Update lead
        lead.setAssignedUserId(selectedUser.getUserId());
        lead.setAssignedUserName(selectedUser.getFullName());
        lead.setAssignedAt(LocalDateTime.now());
        leadRepository.save(lead);

        // Update config (for round-robin)
        if (config.getStrategy() == LeadAssignmentConfig.AssignmentStrategy.ROUND_ROBIN) {
            int newIndex = eligibleUsers.indexOf(selectedUser);
            config.setLastAssignedIndex(newIndex);
            configRepository.save(config);
        }

        log.info("Lead {} assigned to user {}", lead.getId(), selectedUser.getEmail());
    }

    /**
     * Manually assign/reassign a lead to a specific user
     * Validates that user has eligible role
     */
    @Transactional
    public Lead manuallyAssignLead(String leadId, String userId, String modifiedBy) {
        String tenantId = TenantContext.getTenantId();
        log.info("[Tenant: {}] Manually assigning lead {} to user {}", tenantId, leadId, userId);

        // Get lead
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new BusinessException("Lead not found"));

        // Validate tenant ownership
        if (!tenantId.equals(lead.getTenantId())) {
            throw new BusinessException("Access denied");
        }

        // Get user by business userId and tenantId (userId is like USR-2026-02-00003)
        User user = userRepository.findByUserIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new BusinessException("User not found in your organization"));

        // Validate user is active
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException("Cannot assign to inactive user");
        }

        // Validate user has eligible role
        LeadAssignmentConfig config = configRepository.findByTenantId(tenantId)
                .orElse(null);

        // Auto-configure if config is missing or has no eligible roles
        if (config == null || config.getEligibleRoleIds() == null || config.getEligibleRoleIds().isEmpty()) {
            List<String> eligibleRoleIds = roleRepository.findByTenantIdAndIsDeletedFalse(tenantId)
                    .stream()
                    .filter(r -> !"Read-Only User".equals(r.getRoleName()))
                    .map(Role::getRoleId)
                    .collect(java.util.stream.Collectors.toList());

            if (config == null) {
                config = LeadAssignmentConfig.builder()
                        .tenantId(tenantId)
                        .enabled(true)
                        .strategy(LeadAssignmentConfig.AssignmentStrategy.ROUND_ROBIN)
                        .eligibleRoleIds(eligibleRoleIds)
                        .createdAt(LocalDateTime.now())
                        .build();
            } else {
                config.setEligibleRoleIds(eligibleRoleIds);
                config.setEnabled(true);
                config.setLastModifiedAt(LocalDateTime.now());
            }
            configRepository.save(config);
            log.info("[Tenant: {}] Auto-configured lead assignment with {} eligible roles", tenantId, eligibleRoleIds.size());
        }

        if (!config.getEligibleRoleIds().contains(user.getRoleId())) {
            throw new BusinessException(
                    "User does not have an eligible role for lead assignment. " +
                    "Contact admin to configure eligible roles."
            );
        }

        // Assign lead
        String previousUserId = lead.getAssignedUserId();
        lead.setAssignedUserId(user.getUserId());
        lead.setAssignedUserName(user.getFullName());
        lead.setAssignedAt(LocalDateTime.now());
        lead.setLastModifiedBy(modifiedBy);
        lead.setLastModifiedAt(LocalDateTime.now());
        Lead savedLead = leadRepository.save(lead);

        log.info("Lead {} reassigned from user {} to user {}",
                leadId, previousUserId, userId);

        return savedLead;
    }

    /**
     * Get all active users with eligible roles
     */
    private List<User> getEligibleUsers(List<String> eligibleRoleIds, String tenantId) {
        return userRepository.findByTenantIdAndRoleIdInAndStatusAndIsDeletedFalse(
                tenantId,
                eligibleRoleIds,
                UserStatus.ACTIVE
        );
    }

    /**
     * Get assignment strategy by name
     */
    private LeadAssignmentStrategy getStrategy(LeadAssignmentConfig.AssignmentStrategy strategyType) {
        String strategyBean = strategyType == LeadAssignmentConfig.AssignmentStrategy.LEAST_LOADED
                ? "leastLoadedStrategy"
                : "roundRobinStrategy";

        return assignmentStrategies.get(strategyBean);
    }
}
