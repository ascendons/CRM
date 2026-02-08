package com.ultron.backend.service.catalog;

import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Generates unique IDs for dynamic products
 * Format: DPRD-YYYY-MM-XXXXX
 */
@Service
public class DynamicProductIdGeneratorService {

    private final AtomicInteger counter = new AtomicInteger(0);
    private volatile YearMonth lastYearMonth = null;

    public synchronized String generateProductId() {
        YearMonth currentYearMonth = YearMonth.now();

        if (lastYearMonth == null || !currentYearMonth.equals(lastYearMonth)) {
            counter.set(0);
            lastYearMonth = currentYearMonth;
        }

        int sequence = counter.incrementAndGet();

        return String.format("DPRD-%d-%02d-%05d",
            currentYearMonth.getYear(),
            currentYearMonth.getMonthValue(),
            sequence);
    }
}
