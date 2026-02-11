package com.ultron.backend.service;

import com.ultron.backend.domain.entity.LeadAssignmentConfig;
import com.ultron.backend.domain.entity.Role;
import com.ultron.backend.dto.request.UpdateLeadAssignmentConfigRequest;
import com.ultron.backend.dto.response.LeadAssignmentConfigResponse;
import com.ultron.backend.exception.BusinessException;
import com.ultron.backend.multitenancy.TenantContext;
import com.ultron.backend.repository.LeadAssignmentConfigRepository;
import com.ultron.backend.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service to manage lead assignment configuration
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LeadAssignmentConfigService {

    private final LeadAssignmentConfigRepository configRepository;
    private final RoleRepository roleRepository;

    /**
     * Get current configuration for tenant
     */
    public LeadAssignmentConfigResponse getConfiguration() {
        String tenantId = TenantContext.getTenantId();

        LeadAssignmentConfig config = configRepository.findByTenantId(tenantId)
                .orElse(createDefaultConfig(tenantId));

        return mapToResponse(config);
    }

    /**
     * Update configuration
     */
    @Transactional
    public LeadAssignmentConfigResponse updateConfiguration(
            UpdateLeadAssignmentConfigRequest request,
            String modifiedBy) {

        String tenantId = TenantContext.getTenantId();
        log.info("[Tenant: {}] Updating lead assignment config", tenantId);

        // Validate eligible role IDs exist
        if (request.getEligibleRoleIds() != null && !request.getEligibleRoleIds().isEmpty()) {
            List<Role> roles = roleRepository.findByTenantIdAndRoleIdIn(
                    tenantId,
                    request.getEligibleRoleIds()
            );

            if (roles.size() != request.getEligibleRoleIds().size()) {
                throw new BusinessException("One or more role IDs are invalid");
            }
        }

        // Get or create config
        LeadAssignmentConfig config = configRepository.findByTenantId(tenantId)
                .orElse(createDefaultConfig(tenantId));

        // Update fields
        if (request.getEligibleRoleIds() != null) {
            config.setEligibleRoleIds(request.getEligibleRoleIds());
        }

        if (request.getStrategy() != null) {
            config.setStrategy(request.getStrategy());
            // Reset index when strategy changes
            config.setLastAssignedIndex(null);
        }

        if (request.getEnabled() != null) {
            config.setEnabled(request.getEnabled());
        }

        config.setLastModifiedAt(LocalDateTime.now());
        config.setLastModifiedBy(modifiedBy);

        LeadAssignmentConfig savedConfig = configRepository.save(config);
        log.info("Lead assignment config updated for tenant: {}", tenantId);

        return mapToResponse(savedConfig);
    }

    /**
     * Create default configuration
     */
    private LeadAssignmentConfig createDefaultConfig(String tenantId) {
        return LeadAssignmentConfig.builder()
                .tenantId(tenantId)
                .enabled(false)
                .strategy(LeadAssignmentConfig.AssignmentStrategy.ROUND_ROBIN)
                .eligibleRoleIds(List.of())
                .createdAt(LocalDateTime.now())
                .build();
    }

    /**
     * Map entity to response
     */
    private LeadAssignmentConfigResponse mapToResponse(LeadAssignmentConfig config) {
        // Get role names for eligible role IDs
        List<Role> roles = roleRepository.findByTenantIdAndRoleIdIn(
                config.getTenantId(),
                config.getEligibleRoleIds() != null ? config.getEligibleRoleIds() : List.of()
        );

        List<LeadAssignmentConfigResponse.EligibleRoleInfo> roleInfos = roles.stream()
                .map(role -> LeadAssignmentConfigResponse.EligibleRoleInfo.builder()
                        .roleId(role.getRoleId())
                        .roleName(role.getRoleName())
                        .build())
                .collect(Collectors.toList());

        return LeadAssignmentConfigResponse.builder()
                .id(config.getId())
                .tenantId(config.getTenantId())
                .eligibleRoles(roleInfos)
                .strategy(config.getStrategy())
                .enabled(config.getEnabled())
                .createdAt(config.getCreatedAt())
                .lastModifiedAt(config.getLastModifiedAt())
                .build();
    }
}
