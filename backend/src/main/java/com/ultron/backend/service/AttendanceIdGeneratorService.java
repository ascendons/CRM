package com.ultron.backend.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Service to generate unique Attendance IDs in format: ATT-YYYY-MM-XXXXX
 * Example: ATT-2026-03-00125
 */
@Service
public class AttendanceIdGeneratorService {

    private final AtomicInteger counter = new AtomicInteger(0);
    private String lastDate = "";

    public synchronized String generateAttendanceId() {
        LocalDateTime now = LocalDateTime.now();
        String currentDate = now.format(DateTimeFormatter.ofPattern("yyyy-MM"));

        // Reset counter if new month
        if (!currentDate.equals(lastDate)) {
            counter.set(0);
            lastDate = currentDate;
        }

        int sequence = counter.incrementAndGet();

        return String.format("ATT-%s-%05d", currentDate, sequence);
    }
}
