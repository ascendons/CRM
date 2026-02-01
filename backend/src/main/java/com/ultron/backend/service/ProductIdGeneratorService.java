package com.ultron.backend.service;

import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Service to generate unique Product IDs in format: PRD-YYYY-MM-XXXXX
 * Example: PRD-2025-02-00001
 *
 * Thread-safe implementation with proper month boundary handling
 */
@Service
public class ProductIdGeneratorService {

    private final AtomicInteger counter = new AtomicInteger(0);
    private volatile YearMonth lastYearMonth = null;

    public synchronized String generateProductId() {
        YearMonth currentYearMonth = YearMonth.now();

        // Reset counter if new month (using proper YearMonth comparison)
        if (lastYearMonth == null || !currentYearMonth.equals(lastYearMonth)) {
            counter.set(0);
            lastYearMonth = currentYearMonth;
        }

        int sequence = counter.incrementAndGet();

        return String.format("PRD-%d-%02d-%05d",
            currentYearMonth.getYear(),
            currentYearMonth.getMonthValue(),
            sequence);
    }
}
