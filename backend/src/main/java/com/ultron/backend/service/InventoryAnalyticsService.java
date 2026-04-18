package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Product;
import com.ultron.backend.domain.entity.StockTransaction;
import com.ultron.backend.repository.ProductRepository;
import com.ultron.backend.repository.StockTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryAnalyticsService extends BaseTenantService {

    private final ProductRepository productRepository;
    private final StockTransactionRepository stockTransactionRepository;

    @Cacheable(value = "serviceKpis", key = "#root.target.getCurrentTenantId() + '_deadstock'")
    public Map<String, Object> getDeadStockReport() {
        String tenantId = getCurrentTenantId();
        LocalDateTime now = LocalDateTime.now();

        List<StockTransaction> allTxns = stockTransactionRepository
                .findByTenantIdOrderByTimestampDesc(tenantId, PageRequest.of(0, 10000)).getContent();

        // Last movement date per product
        Map<String, LocalDateTime> lastMovement = allTxns.stream()
                .collect(Collectors.toMap(
                        StockTransaction::getProductId,
                        StockTransaction::getTimestamp,
                        (existing, replacement) -> existing.isAfter(replacement) ? existing : replacement
                ));

        List<Map<String, Object>> dead90 = new ArrayList<>();
        List<Map<String, Object>> dead180 = new ArrayList<>();
        List<Map<String, Object>> dead360 = new ArrayList<>();

        lastMovement.forEach((productId, lastMoved) -> {
            long daysSinceMovement = java.time.Duration.between(lastMoved, now).toDays();
            if (daysSinceMovement >= 90) {
                Map<String, Object> entry = Map.of(
                        "productId", productId,
                        "daysSinceLastMovement", daysSinceMovement,
                        "lastMovedAt", lastMoved
                );
                if (daysSinceMovement >= 360) dead360.add(entry);
                else if (daysSinceMovement >= 180) dead180.add(entry);
                else dead90.add(entry);
            }
        });

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("deadStock90Days", dead90);
        result.put("deadStock180Days", dead180);
        result.put("deadStock360Days", dead360);
        result.put("totalDeadStockItems", dead90.size() + dead180.size() + dead360.size());
        return result;
    }

    @Cacheable(value = "serviceKpis", key = "#root.target.getCurrentTenantId() + '_reorder'")
    public List<Map<String, Object>> getReorderRecommendations() {
        String tenantId = getCurrentTenantId();

        return productRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsActive()))
                .filter(p -> p.getReorderPoint() != null
                        && p.getStockQuantity() != null
                        && p.getStockQuantity() <= p.getReorderPoint())
                .map(p -> {
                    Map<String, Object> rec = new LinkedHashMap<>();
                    rec.put("productId", p.getProductId());
                    rec.put("productName", p.getProductName());
                    rec.put("sku", p.getSku());
                    rec.put("currentStock", p.getStockQuantity());
                    rec.put("reorderPoint", p.getReorderPoint());
                    rec.put("suggestedReorderQty", p.getReorderQty() != null ? p.getReorderQty() : p.getReorderPoint() * 2);
                    rec.put("partCategory", p.getPartCategory());
                    rec.put("vendorId", p.getVendorId());
                    return rec;
                })
                .collect(Collectors.toList());
    }

    @Cacheable(value = "serviceKpis", key = "#root.target.getCurrentTenantId() + '_consumption'")
    public List<Map<String, Object>> getTopConsumedParts(int limit) {
        String tenantId = getCurrentTenantId();

        List<StockTransaction> consumptionTxns = stockTransactionRepository
                .findByTenantIdAndTransactionType(tenantId, StockTransaction.TransactionType.PRODUCTION_OUT);

        Map<String, Long> consumptionByPart = consumptionTxns.stream()
                .collect(Collectors.groupingBy(
                        StockTransaction::getProductId,
                        Collectors.summingLong(t -> t.getQuantity() != null ? t.getQuantity() : 0)
                ));

        return consumptionByPart.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(limit)
                .map(e -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("productId", e.getKey());
                    item.put("totalConsumed", e.getValue());
                    return item;
                })
                .collect(Collectors.toList());
    }
}
