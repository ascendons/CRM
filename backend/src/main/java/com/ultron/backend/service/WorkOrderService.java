package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Contract;
import com.ultron.backend.domain.entity.WorkOrder;
import com.ultron.backend.domain.enums.WorkOrderStatus;
import com.ultron.backend.dto.request.CreateWorkOrderRequest;
import com.ultron.backend.dto.request.UpdateWorkOrderRequest;
import com.ultron.backend.dto.response.WorkOrderResponse;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.ContractRepository;
import com.ultron.backend.repository.WorkOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkOrderService extends BaseTenantService {

    private final WorkOrderRepository workOrderRepository;
    private final ContractRepository contractRepository;
    private final WorkOrderIdGeneratorService idGeneratorService;

    public WorkOrderResponse create(CreateWorkOrderRequest request, String userId) {
        String tenantId = getCurrentTenantId();

        // Calculate SLA deadline from contract if linked
        LocalDateTime slaDeadline = null;
        if (request.getContractId() != null) {
            slaDeadline = contractRepository.findById(request.getContractId())
                    .filter(c -> c.getSlaConfig() != null && c.getSlaConfig().getResponseHrs() != null)
                    .map(c -> LocalDateTime.now().plusHours(c.getSlaConfig().getResponseHrs()))
                    .orElse(null);
        }
        // Default 24h SLA if none configured
        if (slaDeadline == null) {
            slaDeadline = LocalDateTime.now().plusHours(24);
        }

        WorkOrder wo = WorkOrder.builder()
                .woNumber(idGeneratorService.generateWorkOrderId())
                .tenantId(tenantId)
                .type(request.getType())
                .priority(request.getPriority())
                .status(request.getAssignedEngineerIds() != null && !request.getAssignedEngineerIds().isEmpty()
                        ? WorkOrderStatus.ASSIGNED : WorkOrderStatus.OPEN)
                .accountId(request.getAccountId())
                .contactId(request.getContactId())
                .assetId(request.getAssetId())
                .contractId(request.getContractId())
                .serviceRequestId(request.getServiceRequestId())
                .assignedEngineerIds(request.getAssignedEngineerIds())
                .slaDeadline(slaDeadline)
                .slaBreached(false)
                .scheduledDate(request.getScheduledDate())
                .symptoms(request.getSymptoms())
                .checklistTemplateId(request.getChecklistTemplateId())
                .reopenCount(0)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(userId)
                .build();

        wo = workOrderRepository.save(wo);
        log.info("Work order created: {} by {}", wo.getWoNumber(), userId);
        return toResponse(wo);
    }

    public List<WorkOrderResponse> getAll() {
        return workOrderRepository.findByTenantIdAndIsDeletedFalse(getCurrentTenantId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<WorkOrderResponse> getByStatus(WorkOrderStatus status) {
        return workOrderRepository.findByTenantIdAndStatusAndIsDeletedFalse(getCurrentTenantId(), status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<WorkOrderResponse> getByEngineer(String engineerId) {
        return workOrderRepository.findByTenantIdAndAssignedEngineerIdsContainingAndIsDeletedFalse(
                        getCurrentTenantId(), engineerId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<WorkOrderResponse> getSlaBreached() {
        return workOrderRepository.findByTenantIdAndSlaBreachedTrueAndIsDeletedFalse(getCurrentTenantId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<WorkOrderResponse> getByAsset(String assetId) {
        return workOrderRepository.findByTenantIdAndAssetIdAndIsDeletedFalse(getCurrentTenantId(), assetId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public WorkOrderResponse getById(String id) {
        return toResponse(findById(id));
    }

    public WorkOrderResponse assign(String id, List<String> engineerIds, String userId) {
        WorkOrder wo = findById(id);
        wo.setAssignedEngineerIds(engineerIds);
        if (wo.getStatus() == WorkOrderStatus.OPEN) {
            wo.setStatus(WorkOrderStatus.ASSIGNED);
        }
        wo.setUpdatedAt(LocalDateTime.now());
        wo.setUpdatedBy(userId);
        return toResponse(workOrderRepository.save(wo));
    }

    /**
     * State machine transition — enforces valid status flows.
     */
    public WorkOrderResponse updateStatus(String id, WorkOrderStatus newStatus, String userId) {
        WorkOrder wo = findById(id);
        validateTransition(wo.getStatus(), newStatus);
        wo.setStatus(newStatus);
        if (newStatus == WorkOrderStatus.IN_PROGRESS && wo.getActualStartTime() == null) {
            wo.setActualStartTime(LocalDateTime.now());
        }
        if (newStatus == WorkOrderStatus.COMPLETED) {
            wo.setActualEndTime(LocalDateTime.now());
        }
        if (newStatus == WorkOrderStatus.REOPENED) {
            wo.setReopenCount(wo.getReopenCount() == null ? 1 : wo.getReopenCount() + 1);
        }
        wo.setUpdatedAt(LocalDateTime.now());
        wo.setUpdatedBy(userId);
        return toResponse(workOrderRepository.save(wo));
    }

    public WorkOrderResponse update(String id, UpdateWorkOrderRequest request, String userId) {
        WorkOrder wo = findById(id);
        if (request.getPriority() != null) wo.setPriority(request.getPriority());
        if (request.getAssignedEngineerIds() != null) wo.setAssignedEngineerIds(request.getAssignedEngineerIds());
        if (request.getScheduledDate() != null) wo.setScheduledDate(request.getScheduledDate());
        if (request.getSymptoms() != null) wo.setSymptoms(request.getSymptoms());
        if (request.getDiagnosis() != null) wo.setDiagnosis(request.getDiagnosis());
        if (request.getResolution() != null) wo.setResolution(request.getResolution());
        if (request.getRootCause() != null) wo.setRootCause(request.getRootCause());
        if (request.getClosureNotes() != null) wo.setClosureNotes(request.getClosureNotes());
        if (request.getTotalLaborHours() != null) wo.setTotalLaborHours(request.getTotalLaborHours());
        if (request.getPartsUsed() != null) wo.setPartsUsed(request.getPartsUsed());
        if (request.getPhotos() != null) wo.setPhotos(request.getPhotos());
        if (request.getStatus() != null) {
            validateTransition(wo.getStatus(), request.getStatus());
            wo.setStatus(request.getStatus());
        }
        wo.setUpdatedAt(LocalDateTime.now());
        wo.setUpdatedBy(userId);
        return toResponse(workOrderRepository.save(wo));
    }

    public void delete(String id, String userId) {
        WorkOrder wo = findById(id);
        wo.setDeleted(true);
        wo.setUpdatedAt(LocalDateTime.now());
        wo.setUpdatedBy(userId);
        workOrderRepository.save(wo);
    }

    private void validateTransition(WorkOrderStatus from, WorkOrderStatus to) {
        boolean valid = switch (from) {
            case OPEN -> to == WorkOrderStatus.ASSIGNED || to == WorkOrderStatus.CANCELLED;
            case ASSIGNED -> to == WorkOrderStatus.EN_ROUTE || to == WorkOrderStatus.CANCELLED || to == WorkOrderStatus.OPEN;
            case EN_ROUTE -> to == WorkOrderStatus.ON_SITE || to == WorkOrderStatus.ASSIGNED;
            case ON_SITE -> to == WorkOrderStatus.IN_PROGRESS || to == WorkOrderStatus.EN_ROUTE;
            case IN_PROGRESS -> to == WorkOrderStatus.PENDING_SPARES || to == WorkOrderStatus.COMPLETED
                    || to == WorkOrderStatus.ON_HOLD || to == WorkOrderStatus.CANCELLED;
            case PENDING_SPARES -> to == WorkOrderStatus.IN_PROGRESS || to == WorkOrderStatus.ON_HOLD;
            case ON_HOLD -> to == WorkOrderStatus.IN_PROGRESS || to == WorkOrderStatus.CANCELLED;
            case COMPLETED -> to == WorkOrderStatus.REOPENED;
            case REOPENED -> to == WorkOrderStatus.ASSIGNED || to == WorkOrderStatus.IN_PROGRESS;
            case CANCELLED -> false;
        };
        if (!valid) {
            throw new IllegalStateException(
                    String.format("Invalid Work Order status transition: %s → %s", from, to));
        }
    }

    private WorkOrder findById(String id) {
        return workOrderRepository.findById(id)
                .filter(w -> w.getTenantId().equals(getCurrentTenantId()) && !w.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Work order not found: " + id));
    }

    private WorkOrderResponse toResponse(WorkOrder w) {
        return WorkOrderResponse.builder()
                .id(w.getId())
                .woNumber(w.getWoNumber())
                .type(w.getType())
                .priority(w.getPriority())
                .status(w.getStatus())
                .accountId(w.getAccountId())
                .contactId(w.getContactId())
                .assetId(w.getAssetId())
                .contractId(w.getContractId())
                .serviceRequestId(w.getServiceRequestId())
                .assignedEngineerIds(w.getAssignedEngineerIds())
                .slaDeadline(w.getSlaDeadline())
                .slaBreached(w.isSlaBreached())
                .scheduledDate(w.getScheduledDate())
                .actualStartTime(w.getActualStartTime())
                .actualEndTime(w.getActualEndTime())
                .symptoms(w.getSymptoms())
                .diagnosis(w.getDiagnosis())
                .resolution(w.getResolution())
                .rootCause(w.getRootCause())
                .checklistTemplateId(w.getChecklistTemplateId())
                .checklistCompletedAt(w.getChecklistCompletedAt())
                .closureNotes(w.getClosureNotes())
                .reopenCount(w.getReopenCount())
                .totalLaborHours(w.getTotalLaborHours())
                .partsUsed(w.getPartsUsed())
                .photos(w.getPhotos())
                .createdAt(w.getCreatedAt())
                .createdBy(w.getCreatedBy())
                .updatedAt(w.getUpdatedAt())
                .updatedBy(w.getUpdatedBy())
                .build();
    }
}
