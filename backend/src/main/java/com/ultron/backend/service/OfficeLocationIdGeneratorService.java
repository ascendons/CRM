package com.ultron.backend.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Service to generate unique Office Location IDs in format: LOC-YYYY-MM-XXXXX
 * Example: LOC-2026-03-00001
 */
@Service
public class OfficeLocationIdGeneratorService {

    private final AtomicInteger counter = new AtomicInteger(0);
    private String lastDate = "";

    public synchronized String generateLocationId() {
        LocalDateTime now = LocalDateTime.now();
        String currentDate = now.format(DateTimeFormatter.ofPattern("yyyy-MM"));

        // Reset counter if new month
        if (!currentDate.equals(lastDate)) {
            counter.set(0);
            lastDate = currentDate;
        }

        int sequence = counter.incrementAndGet();

        return String.format("LOC-%s-%05d", currentDate, sequence);
    }
}
