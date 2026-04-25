package com.ultron.backend.service;

import com.ultron.backend.domain.entity.LeavePolicy;
import com.ultron.backend.domain.enums.LeaveType;
import com.ultron.backend.exception.BusinessException;
import com.ultron.backend.repository.LeavePolicyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeavePolicyService extends BaseTenantService {

    private final LeavePolicyRepository leavePolicyRepository;

    private final ConcurrentHashMap<String, Object> tenantLocks = new ConcurrentHashMap<>();

    /**
     * Get leave policy for current tenant
     * Creates default policy if none exists
     */
    @Cacheable(value = "leavePolicy", key = "#root.target.getCurrentTenantId()")
    public LeavePolicy getPolicy() {
        String tenantId = getCurrentTenantId();
        log.info("Fetching leave policy for tenant: {}", tenantId);

        // Lock per tenant to prevent race condition on policy creation
        Object lock = tenantLocks.computeIfAbsent(tenantId, k -> new Object());
        synchronized (lock) {
            return leavePolicyRepository.findByTenantId(tenantId)
                    .orElseGet(() -> {
                        log.info("No leave policy found for tenant: {}, creating default", tenantId);
                        LeavePolicy defaultPolicy = LeavePolicy.createDefaultPolicy(tenantId);
                        return leavePolicyRepository.save(defaultPolicy);
                    });
        }
    }

    /**
     * Update leave policy
     */
    @Transactional
    @CacheEvict(value = "leavePolicy", key = "#root.target.getCurrentTenantId()")
    public LeavePolicy updatePolicy(LeavePolicy policy, String userId) {
        String tenantId = getCurrentTenantId();
        log.info("Updating leave policy for tenant: {} by user: {}", tenantId, userId);

        Object lock = tenantLocks.get(tenantId);
        if (lock != null) {
            synchronized (lock) {
                return doUpdatePolicy(policy, userId, tenantId);
            }
        }
        return doUpdatePolicy(policy, userId, tenantId);
    }

    private LeavePolicy doUpdatePolicy(LeavePolicy policy, String userId, String tenantId) {
        LeavePolicy existing = leavePolicyRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new BusinessException("Leave policy not found"));

        existing.setLeaveTypes(policy.getLeaveTypes());
        existing.setAllowCarryForward(policy.getAllowCarryForward());
        existing.setMaxCarryForwardDays(policy.getMaxCarryForwardDays());
        existing.setProRateForNewJoiners(policy.getProRateForNewJoiners());
        existing.setLastModifiedAt(LocalDateTime.now());
        existing.setLastModifiedBy(userId);

        LeavePolicy updated = leavePolicyRepository.save(existing);
        log.info("Leave policy updated successfully for tenant: {}", tenantId);

        return updated;
    }

    /**
     * Get default allocation for a leave type
     */
    public Double getDefaultAllocation(LeaveType leaveType) {
        LeavePolicy policy = getPolicy();
        LeavePolicy.LeaveTypePolicy typePolicy = policy.getLeaveTypes().get(leaveType);

        if (typePolicy == null) {
            log.warn("No policy found for leave type: {}, returning 0", leaveType);
            return 0.0;
        }

        return typePolicy.getDefaultAllocation();
    }

    /**
     * Check if a leave type is carry forward enabled
     */
    public Boolean isCarryForwardEnabled(LeaveType leaveType) {
        LeavePolicy policy = getPolicy();
        LeavePolicy.LeaveTypePolicy typePolicy = policy.getLeaveTypes().get(leaveType);

        if (typePolicy == null) {
            return false;
        }

        return typePolicy.getIsCarryForward();
    }

    /**
     * Get maximum carry forward days for a leave type
     */
    public Double getMaxCarryForward(LeaveType leaveType) {
        LeavePolicy policy = getPolicy();
        LeavePolicy.LeaveTypePolicy typePolicy = policy.getLeaveTypes().get(leaveType);

        if (typePolicy == null) {
            return 0.0;
        }

        return typePolicy.getMaxCarryForward();
    }
}
