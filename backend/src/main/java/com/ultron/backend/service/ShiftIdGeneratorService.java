package com.ultron.backend.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Service to generate unique Shift IDs in format: SFT-YYYY-MM-XXXXX
 * Example: SFT-2026-03-00001
 */
@Service
public class ShiftIdGeneratorService {

    private final AtomicInteger counter = new AtomicInteger(0);
    private String lastDate = "";

    public synchronized String generateShiftId() {
        LocalDateTime now = LocalDateTime.now();
        String currentDate = now.format(DateTimeFormatter.ofPattern("yyyy-MM"));

        // Reset counter if new month
        if (!currentDate.equals(lastDate)) {
            counter.set(0);
            lastDate = currentDate;
        }

        int sequence = counter.incrementAndGet();

        return String.format("SFT-%s-%05d", currentDate, sequence);
    }
}
