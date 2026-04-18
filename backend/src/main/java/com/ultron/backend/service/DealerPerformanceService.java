package com.ultron.backend.service;

import com.ultron.backend.domain.entity.DealerOrder;
import com.ultron.backend.domain.entity.DealerPerformance;
import com.ultron.backend.repository.DealerOrderRepository;
import com.ultron.backend.repository.DealerPerformanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DealerPerformanceService extends BaseTenantService {

    private final DealerOrderRepository dealerOrderRepository;
    private final DealerPerformanceRepository dealerPerformanceRepository;

    public DealerPerformance getPerformance(String dealerId, int month, int year) {
        String tenantId = getCurrentTenantId();
        return dealerPerformanceRepository
                .findByTenantIdAndDealerIdAndMonthAndYear(tenantId, dealerId, month, year)
                .orElseGet(() -> aggregateAndSave(tenantId, dealerId, month, year));
    }

    public List<DealerPerformance> getAllForMonth(int month, int year) {
        String tenantId = getCurrentTenantId();
        return dealerPerformanceRepository.findByTenantIdAndMonthAndYear(tenantId, month, year);
    }

    // Runs on the 1st of each month at 1 AM to aggregate previous month
    @Scheduled(cron = "0 0 1 1 * *")
    public void aggregatePreviousMonth() {
        log.info("Running monthly dealer performance aggregation");
        LocalDateTime now = LocalDateTime.now();
        int month = now.getMonthValue() == 1 ? 12 : now.getMonthValue() - 1;
        int year = now.getMonthValue() == 1 ? now.getYear() - 1 : now.getYear();

        List<DealerOrder> allOrders = dealerOrderRepository.findAll();

        Map<String, List<DealerOrder>> byDealer = allOrders.stream()
                .filter(o -> !o.isDeleted() && o.getPlacedAt() != null
                        && o.getPlacedAt().getMonthValue() == month
                        && o.getPlacedAt().getYear() == year)
                .collect(Collectors.groupingBy(o -> o.getTenantId() + "|" + o.getDealerId()));

        byDealer.forEach((key, orders) -> {
            String[] parts = key.split("\\|");
            String tenantId = parts[0];
            String dealerId = parts[1];
            aggregateAndSave(tenantId, dealerId, month, year);
        });

        log.info("Dealer performance aggregation complete for {}/{}", month, year);
    }

    private DealerPerformance aggregateAndSave(String tenantId, String dealerId, int month, int year) {
        List<DealerOrder> orders = dealerOrderRepository
                .findByTenantIdAndDealerIdAndIsDeletedFalse(tenantId, dealerId).stream()
                .filter(o -> o.getPlacedAt() != null
                        && o.getPlacedAt().getMonthValue() == month
                        && o.getPlacedAt().getYear() == year)
                .toList();

        BigDecimal actualSales = orders.stream()
                .filter(o -> "Delivered".equals(o.getStatus()) || "Confirmed".equals(o.getStatus()))
                .map(o -> o.getTotalValue() != null ? o.getTotalValue() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long openOrders = orders.stream()
                .filter(o -> "Pending".equals(o.getStatus()) || "Confirmed".equals(o.getStatus()))
                .count();

        DealerPerformance existing = dealerPerformanceRepository
                .findByTenantIdAndDealerIdAndMonthAndYear(tenantId, dealerId, month, year)
                .orElse(null);

        if (existing != null) {
            existing.setActualSales(actualSales);
            existing.setOpenOrders((int) openOrders);
            existing.setUpdatedAt(LocalDateTime.now());
            return dealerPerformanceRepository.save(existing);
        }

        DealerPerformance perf = DealerPerformance.builder()
                .tenantId(tenantId)
                .dealerId(dealerId)
                .month(month)
                .year(year)
                .actualSales(actualSales)
                .openOrders((int) openOrders)
                .target(BigDecimal.ZERO)
                .incentivesEarned(BigDecimal.ZERO)
                .pendingPayments(BigDecimal.ZERO)
                .createdAt(LocalDateTime.now())
                .createdBy("SYSTEM")
                .build();

        return dealerPerformanceRepository.save(perf);
    }
}
