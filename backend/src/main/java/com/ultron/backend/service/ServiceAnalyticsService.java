package com.ultron.backend.service;

import com.ultron.backend.domain.entity.WorkOrder;
import com.ultron.backend.domain.enums.WorkOrderStatus;
import com.ultron.backend.repository.WorkOrderRepository;
import com.ultron.backend.repository.PartsRequestRepository;
import com.ultron.backend.domain.enums.PartsRequestStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServiceAnalyticsService extends BaseTenantService {

    private final WorkOrderRepository workOrderRepository;
    private final PartsRequestRepository partsRequestRepository;

    @Cacheable(value = "serviceKpis", key = "#root.target.getCurrentTenantId()")
    public Map<String, Object> getKpiSummary() {
        String tenantId = getCurrentTenantId();
        List<WorkOrder> all = workOrderRepository.findByTenantIdAndIsDeletedFalse(tenantId);

        List<WorkOrder> completed = all.stream()
                .filter(w -> w.getStatus() == WorkOrderStatus.COMPLETED || w.getStatus() == WorkOrderStatus.REOPENED)
                .collect(Collectors.toList());

        // MTTR
        double mttrHours = completed.stream()
                .filter(w -> w.getActualStartTime() != null && w.getActualEndTime() != null)
                .mapToLong(w -> Duration.between(w.getActualStartTime(), w.getActualEndTime()).toMinutes())
                .average().orElse(0) / 60.0;

        // First Time Fix Rate
        long closedWithoutReopen = completed.stream()
                .filter(w -> w.getStatus() == WorkOrderStatus.COMPLETED
                        && (w.getReopenCount() == null || w.getReopenCount() == 0))
                .count();
        double ftfr = completed.isEmpty() ? 0 : (double) closedWithoutReopen / completed.size() * 100;

        // SLA Compliance Rate
        long withinSla = completed.stream()
                .filter(w -> !w.isSlaBreached()).count();
        double slaCompliance = completed.isEmpty() ? 0 : (double) withinSla / completed.size() * 100;

        // Repeat Visit Rate (same asset within 30 days of previous close)
        long repeatVisits = completed.stream()
                .filter(w -> w.getAssetId() != null)
                .collect(Collectors.groupingBy(WorkOrder::getAssetId))
                .values().stream()
                .mapToLong(list -> {
                    list.sort(Comparator.comparing(WorkOrder::getCreatedAt));
                    long repeats = 0;
                    for (int i = 1; i < list.size(); i++) {
                        WorkOrder prev = list.get(i - 1);
                        WorkOrder curr = list.get(i);
                        if (prev.getActualEndTime() != null && curr.getCreatedAt() != null
                                && Duration.between(prev.getActualEndTime(), curr.getCreatedAt()).toDays() <= 30) {
                            repeats++;
                        }
                    }
                    return repeats;
                }).sum();
        double repeatVisitRate = completed.isEmpty() ? 0 : (double) repeatVisits / completed.size() * 100;

        // Open WO aging buckets
        LocalDateTime now = LocalDateTime.now();
        List<WorkOrder> open = all.stream()
                .filter(w -> w.getStatus() != WorkOrderStatus.COMPLETED
                        && w.getStatus() != WorkOrderStatus.CANCELLED
                        && w.getStatus() != WorkOrderStatus.REOPENED)
                .collect(Collectors.toList());

        Map<String, Long> agingBuckets = new LinkedHashMap<>();
        agingBuckets.put("0-4h", open.stream().filter(w -> hours(w, now) <= 4).count());
        agingBuckets.put("4-8h", open.stream().filter(w -> hours(w, now) > 4 && hours(w, now) <= 8).count());
        agingBuckets.put("8-24h", open.stream().filter(w -> hours(w, now) > 8 && hours(w, now) <= 24).count());
        agingBuckets.put("24h+", open.stream().filter(w -> hours(w, now) > 24).count());

        // Engineer productivity (WOs completed per engineer)
        Map<String, Long> engineerProductivity = completed.stream()
                .filter(w -> w.getAssignedEngineerIds() != null)
                .flatMap(w -> w.getAssignedEngineerIds().stream().map(e -> Map.entry(e, w)))
                .collect(Collectors.groupingBy(Map.Entry::getKey, Collectors.counting()));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("mttrHours", Math.round(mttrHours * 10.0) / 10.0);
        result.put("firstTimeFixRatePct", Math.round(ftfr * 10.0) / 10.0);
        result.put("slaComplianceRatePct", Math.round(slaCompliance * 10.0) / 10.0);
        result.put("repeatVisitRatePct", Math.round(repeatVisitRate * 10.0) / 10.0);
        result.put("totalOpenWOs", open.size());
        result.put("totalCompletedWOs", completed.size());
        result.put("openWOAgingBuckets", agingBuckets);
        result.put("engineerProductivity", engineerProductivity);
        return result;
    }

    @Cacheable(value = "serviceKpis", key = "#root.target.getCurrentTenantId() + '_volume'")
    public Map<String, Object> getVolumeByTypeAndPriority() {
        String tenantId = getCurrentTenantId();
        List<WorkOrder> all = workOrderRepository.findByTenantIdAndIsDeletedFalse(tenantId);

        Map<String, Long> byType = all.stream()
                .filter(w -> w.getType() != null)
                .collect(Collectors.groupingBy(w -> w.getType().name(), Collectors.counting()));

        Map<String, Long> byPriority = all.stream()
                .filter(w -> w.getPriority() != null)
                .collect(Collectors.groupingBy(w -> w.getPriority().name(), Collectors.counting()));

        Map<String, Long> byStatus = all.stream()
                .filter(w -> w.getStatus() != null)
                .collect(Collectors.groupingBy(w -> w.getStatus().name(), Collectors.counting()));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("byType", byType);
        result.put("byPriority", byPriority);
        result.put("byStatus", byStatus);
        return result;
    }

    public Map<String, Object> getPartsAvailabilityRate() {
        String tenantId = getCurrentTenantId();
        List<com.ultron.backend.domain.entity.PartsRequest> all =
                partsRequestRepository.findByTenantIdAndIsDeletedFalse(tenantId);

        long total = all.size();
        long sameDayFulfilled = all.stream()
                .filter(pr -> pr.getStatus() == PartsRequestStatus.DISPATCHED
                        || pr.getStatus() == PartsRequestStatus.RECEIVED)
                .filter(pr -> pr.getDispatchedAt() != null && pr.getCreatedAt() != null
                        && Duration.between(pr.getCreatedAt(), pr.getDispatchedAt()).toHours() <= 24)
                .count();

        double rate = total == 0 ? 0 : (double) sameDayFulfilled / total * 100;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalPartsRequests", total);
        result.put("sameDayFulfilledCount", sameDayFulfilled);
        result.put("partsAvailabilityRatePct", Math.round(rate * 10.0) / 10.0);
        return result;
    }

    private long hours(WorkOrder w, LocalDateTime now) {
        if (w.getCreatedAt() == null) return 0;
        return Duration.between(w.getCreatedAt(), now).toHours();
    }
}
