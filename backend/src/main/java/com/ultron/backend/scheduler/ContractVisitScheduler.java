package com.ultron.backend.scheduler;

import com.ultron.backend.domain.entity.ContractVisit;
import com.ultron.backend.domain.entity.WorkOrder;
import com.ultron.backend.domain.enums.ContractVisitStatus;
import com.ultron.backend.domain.enums.WorkOrderPriority;
import com.ultron.backend.domain.enums.WorkOrderStatus;
import com.ultron.backend.domain.enums.WorkOrderType;
import com.ultron.backend.repository.ContractVisitRepository;
import com.ultron.backend.repository.WorkOrderRepository;
import com.ultron.backend.service.WorkOrderIdGeneratorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@SuppressWarnings("unused")

@Component
@RequiredArgsConstructor
@Slf4j
public class ContractVisitScheduler {

    private final ContractVisitRepository visitRepository;
    private final WorkOrderRepository workOrderRepository;
    private final WorkOrderIdGeneratorService woIdGenerator;

    // Runs daily at 6 AM — creates WOs for visits due today or overdue with no WO
    @Scheduled(cron = "0 0 6 * * *")
    public void autoCreateWorkOrdersForDueVisits() {
        log.info("Running contract visit scheduler");
        LocalDate today = LocalDate.now();

        List<ContractVisit> scheduled = visitRepository
                .findByStatusAndWorkOrderIdIsNull(ContractVisitStatus.SCHEDULED).stream()
                .filter(v -> v.getScheduledDate() != null
                        && !v.getScheduledDate().isAfter(today)
                        && v.getTenantId() != null)
                .toList();

        for (ContractVisit visit : scheduled) {
            try {
                createWorkOrderForVisit(visit);
            } catch (Exception e) {
                log.error("Failed to create WO for visit {}: {}", visit.getId(), e.getMessage());
            }
        }

        log.info("Contract visit scheduler: processed {} due visits", scheduled.size());
    }

    private void createWorkOrderForVisit(ContractVisit visit) {
        WorkOrder wo = WorkOrder.builder()
                .woNumber(woIdGenerator.generateWorkOrderId())
                .tenantId(visit.getTenantId())
                .type(WorkOrderType.AMC_VISIT)
                .contractId(visit.getContractId())
                .priority(WorkOrderPriority.MEDIUM)
                .status(WorkOrderStatus.OPEN)
                .symptoms("Scheduled AMC visit #" + visit.getVisitNumber())
                .scheduledDate(visit.getScheduledDate() != null
                        ? visit.getScheduledDate() : LocalDate.now())
                .slaBreached(false)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy("SYSTEM")
                .build();

        WorkOrder saved = workOrderRepository.save(wo);

        visit.setWorkOrderId(saved.getId());
        visitRepository.save(visit);

        log.info("Auto-created WO {} for contract visit {} (contract {})",
                saved.getWoNumber(), visit.getId(), visit.getContractId());
    }
}
