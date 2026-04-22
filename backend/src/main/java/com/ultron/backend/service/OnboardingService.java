package com.ultron.backend.service;

import com.ultron.backend.domain.entity.OnboardingInstance;
import com.ultron.backend.domain.entity.OnboardingTemplate;
import com.ultron.backend.repository.OnboardingInstanceRepository;
import com.ultron.backend.repository.OnboardingTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor @Slf4j
public class OnboardingService extends BaseTenantService {
    private final OnboardingTemplateRepository templateRepo;
    private final OnboardingInstanceRepository instanceRepo;

    public OnboardingTemplate createTemplate(OnboardingTemplate template, String userId) {
        String tenantId = getCurrentTenantId();
        template.setTemplateId("OT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        template.setTenantId(tenantId);
        template.setDeleted(false);
        template.setCreatedAt(LocalDateTime.now()); template.setCreatedBy(userId);
        template.setUpdatedAt(LocalDateTime.now()); template.setUpdatedBy(userId);
        return templateRepo.save(template);
    }

    public List<OnboardingTemplate> getTemplates() {
        return templateRepo.findByTenantIdAndIsDeletedFalse(getCurrentTenantId());
    }

    public OnboardingTemplate getTemplate(String templateId) {
        return templateRepo.findByTemplateIdAndTenantIdAndIsDeletedFalse(templateId, getCurrentTenantId())
                .orElseThrow(() -> new RuntimeException("Template not found"));
    }

    public void deleteTemplate(String templateId, String userId) {
        OnboardingTemplate t = getTemplate(templateId);
        t.setDeleted(true); t.setUpdatedAt(LocalDateTime.now()); t.setUpdatedBy(userId);
        templateRepo.save(t);
    }

    public OnboardingInstance createInstance(String templateId, String employeeId, LocalDate startDate, String mentorId, String userId) {
        String tenantId = getCurrentTenantId();
        OnboardingTemplate template = getTemplate(templateId);
        List<OnboardingInstance.InstanceTask> tasks = template.getTasks() == null ? List.of() :
                template.getTasks().stream().map(t -> OnboardingInstance.InstanceTask.builder()
                        .taskTitle(t.getTaskTitle()).description(t.getDescription())
                        .assigneeTo(t.getAssigneeTo()).dueDaysFromStart(t.getDueDaysFromStart())
                        .isRequired(t.isRequired()).status("PENDING").build()).collect(Collectors.toList());
        OnboardingInstance instance = OnboardingInstance.builder()
                .instanceId("OI-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .tenantId(tenantId).templateId(templateId).employeeId(employeeId)
                .mentorId(mentorId).startDate(startDate).tasks(tasks).progress(0)
                .isDeleted(false).createdAt(LocalDateTime.now()).createdBy(userId)
                .updatedAt(LocalDateTime.now()).updatedBy(userId).build();
        return instanceRepo.save(instance);
    }

    public OnboardingInstance completeTask(String instanceId, int taskIndex, String userId) {
        OnboardingInstance instance = instanceRepo.findByInstanceIdAndTenantIdAndIsDeletedFalse(instanceId, getCurrentTenantId())
                .orElseThrow(() -> new RuntimeException("Instance not found"));
        if (taskIndex >= instance.getTasks().size()) throw new RuntimeException("Task not found");
        instance.getTasks().get(taskIndex).setStatus("DONE");
        instance.getTasks().get(taskIndex).setCompletedAt(LocalDateTime.now());
        instance.getTasks().get(taskIndex).setCompletedBy(userId);
        long done = instance.getTasks().stream().filter(t -> "DONE".equals(t.getStatus())).count();
        instance.setProgress((int) (done * 100 / instance.getTasks().size()));
        instance.setUpdatedAt(LocalDateTime.now()); instance.setUpdatedBy(userId);
        return instanceRepo.save(instance);
    }

    public List<OnboardingInstance> getInstancesByEmployee(String employeeId) {
        return instanceRepo.findByEmployeeIdAndTenantIdAndIsDeletedFalse(employeeId, getCurrentTenantId());
    }

    public List<OnboardingInstance> getInstances() {
        return instanceRepo.findByTenantIdAndIsDeletedFalse(getCurrentTenantId());
    }
}
