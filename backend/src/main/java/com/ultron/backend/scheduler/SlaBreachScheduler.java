package com.ultron.backend.scheduler;

import com.ultron.backend.domain.entity.WorkOrder;
import com.ultron.backend.domain.enums.WorkOrderStatus;
import com.ultron.backend.repository.WorkOrderRepository;
import com.ultron.backend.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Runs every 5 minutes to detect and mark SLA-breached Work Orders.
 * Sets slaBreached=true when slaDeadline has passed and WO is still open.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SlaBreachScheduler {

    private final WorkOrderRepository workOrderRepository;
    private final OrganizationRepository organizationRepository;

    @Scheduled(fixedDelay = 5 * 60 * 1000)   // every 5 minutes
    public void detectSlaBreaches() {
        log.debug("SLA breach detection running at {}", LocalDateTime.now());

        // Fetch all tenants
        organizationRepository.findAll().forEach(org -> {
            String tenantId = org.getId();
            try {
                List<WorkOrder> breached = workOrderRepository
                        .findByTenantIdAndSlaDeadlineBeforeAndStatusNotAndIsDeletedFalse(
                                tenantId,
                                LocalDateTime.now(),
                                WorkOrderStatus.COMPLETED
                        );

                breached.stream()
                        .filter(wo -> !wo.isSlaBreached())
                        .forEach(wo -> {
                            wo.setSlaBreached(true);
                            wo.setUpdatedAt(LocalDateTime.now());
                            workOrderRepository.save(wo);
                            log.warn("SLA breached — WO: {}, tenant: {}, deadline was: {}",
                                    wo.getWoNumber(), tenantId, wo.getSlaDeadline());
                        });

            } catch (Exception e) {
                log.error("SLA breach detection failed for tenant {}: {}", tenantId, e.getMessage());
            }
        });
    }
}
