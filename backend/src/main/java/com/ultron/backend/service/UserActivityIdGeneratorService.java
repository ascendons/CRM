package com.ultron.backend.service;

import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Service to generate unique User Activity IDs in format: UACT-YYYY-MM-XXXXX
 * Example: UACT-2026-02-00001
 *
 * Thread-safe implementation with proper month boundary handling
 */
@Service
public class UserActivityIdGeneratorService {

    private final AtomicInteger counter = new AtomicInteger(0);
    private volatile YearMonth lastYearMonth = null;

    public synchronized String generateActivityId() {
        YearMonth currentYearMonth = YearMonth.now();

        // Reset counter if new month (using proper YearMonth comparison)
        if (lastYearMonth == null || !currentYearMonth.equals(lastYearMonth)) {
            counter.set(0);
            lastYearMonth = currentYearMonth;
        }

        int sequence = counter.incrementAndGet();

        return String.format("UACT-%d-%02d-%05d",
            currentYearMonth.getYear(),
            currentYearMonth.getMonthValue(),
            sequence);
    }
}
