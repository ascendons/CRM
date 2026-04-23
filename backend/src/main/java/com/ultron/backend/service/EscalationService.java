package com.ultron.backend.service;

import com.ultron.backend.domain.entity.*;
import com.ultron.backend.domain.enums.EscalationTrigger;
import com.ultron.backend.domain.enums.ServiceRequestStatus;
import com.ultron.backend.domain.enums.WorkOrderStatus;
import com.ultron.backend.dto.request.CreateEscalationRuleRequest;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EscalationService extends BaseTenantService {

    private final EscalationRuleRepository ruleRepository;
    private final EscalationLogRepository logRepository;
    private final WorkOrderRepository workOrderRepository;
    private final ServiceRequestRepository serviceRequestRepository;

    public EscalationRule createRule(CreateEscalationRuleRequest request, String tenantId, String userId) {
        EscalationRule rule = EscalationRule.builder()
                .tenantId(tenantId)
                .name(request.getName())
                .trigger(request.getTrigger())
                .conditionMinutes(request.getConditionMinutes())
                .level(request.getLevel())
                .notifyUserIds(request.getNotifyUserIds())
                .notificationChannels(request.getNotificationChannels())
                .autoEscalateAfterMinutes(request.getAutoEscalateAfterMinutes())
                .active(request.isActive())
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(userId)
                .build();
        rule = ruleRepository.save(rule);
        log.info("Escalation rule created: {} ({})", rule.getName(), rule.getTrigger());
        return rule;
    }

    public List<EscalationRule> getRules(String tenantId) {
        return ruleRepository.findByTenantIdAndIsDeletedFalse(tenantId);
    }

    public EscalationRule updateRule(String id, CreateEscalationRuleRequest request, String tenantId, String userId) {
        EscalationRule rule = findRuleById(id, tenantId);
        if (request.getName() != null) rule.setName(request.getName());
        if (request.getTrigger() != null) rule.setTrigger(request.getTrigger());
        if (request.getConditionMinutes() != null) rule.setConditionMinutes(request.getConditionMinutes());
        if (request.getLevel() != null) rule.setLevel(request.getLevel());
        if (request.getNotifyUserIds() != null) rule.setNotifyUserIds(request.getNotifyUserIds());
        if (request.getNotificationChannels() != null) rule.setNotificationChannels(request.getNotificationChannels());
        rule.setActive(request.isActive());
        rule.setUpdatedAt(LocalDateTime.now());
        rule.setUpdatedBy(userId);
        return ruleRepository.save(rule);
    }

    public void deleteRule(String id, String tenantId, String userId) {
        EscalationRule rule = findRuleById(id, tenantId);
        rule.setDeleted(true);
        rule.setUpdatedAt(LocalDateTime.now());
        rule.setUpdatedBy(userId);
        ruleRepository.save(rule);
    }

    public List<EscalationLog> getLogs(String tenantId) {
        return logRepository.findByTenantIdOrderByTriggeredAtDesc(tenantId);
    }

    public List<EscalationLog> getOpenEscalations(String tenantId) {
        return logRepository.findByTenantIdAndResolvedAtIsNull(tenantId);
    }

    public EscalationLog acknowledge(String logId, String tenantId, String userId) {
        EscalationLog log = logRepository.findById(logId)
                .filter(l -> l.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Escalation log not found: " + logId));
        log.setAcknowledgedAt(LocalDateTime.now());
        log.setAcknowledgedBy(userId);
        return logRepository.save(log);
    }

    public EscalationLog resolve(String logId, String tenantId) {
        EscalationLog log = logRepository.findById(logId)
                .filter(l -> l.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Escalation log not found: " + logId));
        log.setResolvedAt(LocalDateTime.now());
        return logRepository.save(log);
    }

    // Runs every 5 minutes across all tenants
    @Scheduled(fixedDelay = 300000)
    public void evaluateAllRules() {
        log.debug("Running escalation evaluation");

        // Collect distinct tenants from active rules
        ruleRepository.findAll().stream()
                .filter(r -> r.isActive() && !r.isDeleted())
                .map(EscalationRule::getTenantId)
                .distinct()
                .forEach(this::evaluateTenant);
    }

    private void evaluateTenant(String tenantId) {
        List<EscalationRule> rules = ruleRepository.findByTenantIdAndActiveTrueAndIsDeletedFalse(tenantId);

        for (EscalationRule rule : rules) {
            try {
                evaluateRule(rule, tenantId);
            } catch (Exception e) {
                log.warn("Error evaluating escalation rule {}: {}", rule.getId(), e.getMessage());
            }
        }
    }

    private void evaluateRule(EscalationRule rule, String tenantId) {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(rule.getConditionMinutes());

        switch (rule.getTrigger()) {
            case SLA_BREACH -> {
                List<WorkOrder> breached = workOrderRepository
                        .findByTenantIdAndSlaBreachedTrueAndIsDeletedFalse(tenantId);
                for (WorkOrder wo : breached) {
                    fireIfNotAlreadyLogged(rule, "WorkOrder", wo.getId(), tenantId);
                }
            }
            case WO_UNASSIGNED -> {
                List<WorkOrder> unassigned = workOrderRepository
                        .findByTenantIdAndStatusAndIsDeletedFalse(tenantId, WorkOrderStatus.OPEN)
                        .stream()
                        .filter(wo -> wo.getCreatedAt() != null && wo.getCreatedAt().isBefore(threshold))
                        .collect(Collectors.toList());
                for (WorkOrder wo : unassigned) {
                    fireIfNotAlreadyLogged(rule, "WorkOrder", wo.getId(), tenantId);
                }
            }
            case SR_UNACKNOWLEDGED -> {
                List<ServiceRequest> unacked = serviceRequestRepository
                        .findByTenantIdAndStatusAndIsDeletedFalse(tenantId, ServiceRequestStatus.OPEN)
                        .stream()
                        .filter(sr -> sr.getCreatedAt() != null && sr.getCreatedAt().isBefore(threshold))
                        .collect(Collectors.toList());
                for (ServiceRequest sr : unacked) {
                    fireIfNotAlreadyLogged(rule, "ServiceRequest", sr.getId(), tenantId);
                }
            }
            default -> log.debug("Trigger {} not evaluated in scheduler", rule.getTrigger());
        }
    }

    private void fireIfNotAlreadyLogged(EscalationRule rule, String entityType, String entityId, String tenantId) {
        boolean alreadyFired = !logRepository
                .findByTenantIdAndEntityTypeAndEntityId(tenantId, entityType, entityId)
                .stream()
                .filter(l -> l.getRuleId().equals(rule.getId()) && l.getResolvedAt() == null)
                .collect(Collectors.toList())
                .isEmpty();

        if (alreadyFired) return;

        EscalationLog escalationLog = EscalationLog.builder()
                .tenantId(tenantId)
                .ruleId(rule.getId())
                .entityType(entityType)
                .entityId(entityId)
                .triggeredAt(LocalDateTime.now())
                .level(rule.getLevel())
                .notifiedUserIds(rule.getNotifyUserIds())
                .build();
        logRepository.save(escalationLog);
        log.info("Escalation fired: rule={} entity={}/{} level={}", rule.getName(), entityType, entityId, rule.getLevel());
    }

    private EscalationRule findRuleById(String id, String tenantId) {
        return ruleRepository.findById(id)
                .filter(r -> r.getTenantId().equals(tenantId) && !r.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Escalation rule not found: " + id));
    }
}
