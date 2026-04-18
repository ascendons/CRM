package com.ultron.backend.service;

import com.ultron.backend.domain.entity.WorkOrderChecklist;
import com.ultron.backend.domain.entity.WorkOrderChecklistResponse;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.WorkOrderChecklistRepository;
import com.ultron.backend.repository.WorkOrderChecklistResponseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChecklistService extends BaseTenantService {

    private final WorkOrderChecklistRepository checklistRepository;
    private final WorkOrderChecklistResponseRepository responseRepository;

    // ── Templates ──────────────────────────────────────────────────────────

    public WorkOrderChecklist createTemplate(WorkOrderChecklist template, String userId) {
        String tenantId = getCurrentTenantId();
        template.setTenantId(tenantId);
        template.setDeleted(false);
        template.setCreatedAt(LocalDateTime.now());
        template.setCreatedBy(userId);
        WorkOrderChecklist saved = checklistRepository.save(template);
        log.info("Checklist template created: {} by {}", saved.getId(), userId);
        return saved;
    }

    public List<WorkOrderChecklist> getAllTemplates() {
        return checklistRepository.findByTenantIdAndIsDeletedFalse(getCurrentTenantId());
    }

    public List<WorkOrderChecklist> getTemplatesByCategory(String assetCategoryId) {
        return checklistRepository.findByTenantIdAndAssetCategoryIdAndIsDeletedFalse(
                getCurrentTenantId(), assetCategoryId);
    }

    public WorkOrderChecklist getTemplateById(String id) {
        return checklistRepository.findById(id)
                .filter(c -> c.getTenantId().equals(getCurrentTenantId()) && !c.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Checklist template not found: " + id));
    }

    public WorkOrderChecklist updateTemplate(String id, WorkOrderChecklist update, String userId) {
        WorkOrderChecklist existing = getTemplateById(id);
        existing.setName(update.getName());
        existing.setJobType(update.getJobType());
        existing.setItems(update.getItems());
        existing.setUpdatedAt(LocalDateTime.now());
        existing.setUpdatedBy(userId);
        return checklistRepository.save(existing);
    }

    public void deleteTemplate(String id, String userId) {
        WorkOrderChecklist template = getTemplateById(id);
        template.setDeleted(true);
        template.setUpdatedAt(LocalDateTime.now());
        template.setUpdatedBy(userId);
        checklistRepository.save(template);
    }

    // ── Execution (per Work Order) ──────────────────────────────────────────

    public WorkOrderChecklistResponse startChecklist(String workOrderId, String templateId,
                                                      String engineerId, String userId) {
        String tenantId = getCurrentTenantId();
        WorkOrderChecklistResponse response = WorkOrderChecklistResponse.builder()
                .tenantId(tenantId)
                .workOrderId(workOrderId)
                .templateId(templateId)
                .engineerId(engineerId)
                .startedAt(LocalDateTime.now())
                .build();
        WorkOrderChecklistResponse saved = responseRepository.save(response);
        log.info("Checklist started for WO {} by engineer {}", workOrderId, engineerId);
        return saved;
    }

    public WorkOrderChecklistResponse saveResponses(String workOrderId,
                                                     List<WorkOrderChecklistResponse.ItemResponse> responses,
                                                     String userId) {
        WorkOrderChecklistResponse existing = responseRepository
                .findByWorkOrderIdAndTenantId(workOrderId, getCurrentTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Checklist response not found for WO: " + workOrderId));
        existing.setResponses(responses);
        return responseRepository.save(existing);
    }

    public WorkOrderChecklistResponse completeChecklist(String workOrderId, String userId) {
        WorkOrderChecklistResponse existing = responseRepository
                .findByWorkOrderIdAndTenantId(workOrderId, getCurrentTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Checklist response not found for WO: " + workOrderId));
        existing.setCompletedAt(LocalDateTime.now());
        return responseRepository.save(existing);
    }

    public WorkOrderChecklistResponse getResponseByWorkOrder(String workOrderId) {
        return responseRepository.findByWorkOrderIdAndTenantId(workOrderId, getCurrentTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("No checklist response for WO: " + workOrderId));
    }
}
