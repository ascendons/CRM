package com.ultron.backend.service;

import com.ultron.backend.domain.entity.PurchaseOrder;
import com.ultron.backend.exception.BadRequestException;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.PurchaseOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PurchaseOrderApprovalService extends BaseTenantService {

    private final PurchaseOrderRepository purchaseOrderRepository;

    // Thresholds (INR): < 50k → L1 only, 50k-5L → L1+L2, > 5L → L1+L2+L3
    private static final BigDecimal L2_THRESHOLD = new BigDecimal("50000");
    private static final BigDecimal L3_THRESHOLD = new BigDecimal("500000");

    public PurchaseOrder submitForApproval(String poId) {
        String tenantId = getCurrentTenantId();
        PurchaseOrder po = findPo(poId, tenantId);

        if (po.getStatus() != PurchaseOrder.POStatus.DRAFT) {
            throw new BadRequestException("Only DRAFT POs can be submitted for approval");
        }

        List<PurchaseOrder.ApprovalStep> workflow = buildWorkflow(po.getTotalAmount());
        po.setApprovalWorkflow(workflow);
        po.setStatus(PurchaseOrder.POStatus.SUBMITTED);
        po.setLastModifiedAt(LocalDateTime.now());
        po.setLastModifiedBy(getCurrentUserId());

        log.info("PO {} submitted for approval with {} levels", po.getPoNumber(), workflow.size());
        return purchaseOrderRepository.save(po);
    }

    public PurchaseOrder approve(String poId, String level, String comments) {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();
        PurchaseOrder po = findPo(poId, tenantId);

        if (po.getStatus() != PurchaseOrder.POStatus.SUBMITTED) {
            throw new BadRequestException("PO is not pending approval");
        }

        PurchaseOrder.ApprovalStep step = getStepByLevel(po, level);
        if (!"Pending".equals(step.getStatus())) {
            throw new BadRequestException("Step " + level + " is already " + step.getStatus());
        }

        // Ensure prior levels are approved
        validatePriorLevelsApproved(po, level);

        step.setApproverId(userId);
        step.setStatus("Approved");
        step.setApprovedAt(LocalDateTime.now());
        step.setComments(comments);

        if (allLevelsApproved(po)) {
            po.setStatus(PurchaseOrder.POStatus.APPROVED);
            po.setApprovedBy(userId);
            po.setApprovedAt(LocalDateTime.now());
            log.info("PO {} fully approved", po.getPoNumber());
        }

        po.setLastModifiedAt(LocalDateTime.now());
        po.setLastModifiedBy(userId);
        return purchaseOrderRepository.save(po);
    }

    public PurchaseOrder reject(String poId, String level, String reason) {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();
        PurchaseOrder po = findPo(poId, tenantId);

        if (po.getStatus() != PurchaseOrder.POStatus.SUBMITTED) {
            throw new BadRequestException("PO is not pending approval");
        }

        PurchaseOrder.ApprovalStep step = getStepByLevel(po, level);
        step.setApproverId(userId);
        step.setStatus("Rejected");
        step.setComments(reason);

        po.setStatus(PurchaseOrder.POStatus.CANCELLED);
        po.setRejectedBy(userId);
        po.setRejectedAt(LocalDateTime.now());
        po.setRejectionReason(reason);
        po.setLastModifiedAt(LocalDateTime.now());
        po.setLastModifiedBy(userId);

        log.info("PO {} rejected at level {} by {}", po.getPoNumber(), level, userId);
        return purchaseOrderRepository.save(po);
    }

    public List<PurchaseOrder> getPendingApprovals() {
        String tenantId = getCurrentTenantId();
        return purchaseOrderRepository.findByTenantIdAndStatus(
                tenantId, PurchaseOrder.POStatus.SUBMITTED);
    }

    private List<PurchaseOrder.ApprovalStep> buildWorkflow(BigDecimal totalAmount) {
        List<PurchaseOrder.ApprovalStep> steps = new ArrayList<>();
        steps.add(PurchaseOrder.ApprovalStep.builder().level("L1").status("Pending").build());
        if (totalAmount != null && totalAmount.compareTo(L2_THRESHOLD) >= 0) {
            steps.add(PurchaseOrder.ApprovalStep.builder().level("L2").status("Pending").build());
        }
        if (totalAmount != null && totalAmount.compareTo(L3_THRESHOLD) >= 0) {
            steps.add(PurchaseOrder.ApprovalStep.builder().level("L3").status("Pending").build());
        }
        return steps;
    }

    private void validatePriorLevelsApproved(PurchaseOrder po, String level) {
        int targetOrdinal = levelOrdinal(level);
        for (PurchaseOrder.ApprovalStep step : po.getApprovalWorkflow()) {
            if (levelOrdinal(step.getLevel()) < targetOrdinal && !"Approved".equals(step.getStatus())) {
                throw new BadRequestException("Level " + step.getLevel() + " approval is required first");
            }
        }
    }

    private boolean allLevelsApproved(PurchaseOrder po) {
        return po.getApprovalWorkflow().stream().allMatch(s -> "Approved".equals(s.getStatus()));
    }

    private PurchaseOrder.ApprovalStep getStepByLevel(PurchaseOrder po, String level) {
        return po.getApprovalWorkflow().stream()
                .filter(s -> s.getLevel().equals(level))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Approval level " + level + " not in workflow"));
    }

    private int levelOrdinal(String level) {
        return switch (level) {
            case "L1" -> 1;
            case "L2" -> 2;
            case "L3" -> 3;
            default -> 99;
        };
    }

    private PurchaseOrder findPo(String id, String tenantId) {
        return purchaseOrderRepository.findById(id)
                .filter(p -> p.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found: " + id));
    }
}
