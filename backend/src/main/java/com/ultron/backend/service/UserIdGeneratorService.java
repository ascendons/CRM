package com.ultron.backend.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Service to generate unique User IDs in format: USR-YYYY-MM-XXXXX
 * Example: USR-2026-01-00125
 */
@Service
public class UserIdGeneratorService {

    private final AtomicInteger counter = new AtomicInteger(0);
    private String lastDate = "";

    public synchronized String generateUserId() {
        LocalDateTime now = LocalDateTime.now();
        String currentDate = now.format(DateTimeFormatter.ofPattern("yyyy-MM"));

        // Reset counter if new month
        if (!currentDate.equals(lastDate)) {
            counter.set(0);
            lastDate = currentDate;
        }

        int sequence = counter.incrementAndGet();

        return String.format("USR-%s-%05d", currentDate, sequence);
    }
}
