package com.ultron.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Service to generate unique Attendance IDs using timestamp-based format
 * Format: ATT-YYYYMMDD-HHmmss-XXX
 * Example: ATT-20260308-143052-001
 *
 * This approach prevents duplicates by using timestamp + counter for same-second requests
 * No database queries needed, works across server restarts
 */
@Service
@Slf4j
public class AttendanceIdGeneratorService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HHmmss");

    private String lastTimestamp = "";
    private final AtomicInteger sameSecondCounter = new AtomicInteger(0);

    public synchronized String generateAttendanceId() {
        LocalDateTime now = LocalDateTime.now();
        String dateStr = now.format(DATE_FORMAT);
        String timeStr = now.format(TIME_FORMAT);
        String currentTimestamp = dateStr + "-" + timeStr;

        // Reset counter if timestamp changed (new second)
        if (!currentTimestamp.equals(lastTimestamp)) {
            sameSecondCounter.set(0);
            lastTimestamp = currentTimestamp;
        }

        // Increment counter for same-second requests
        int counter = sameSecondCounter.incrementAndGet();

        String attendanceId = String.format("ATT-%s-%03d", currentTimestamp, counter);
        log.debug("Generated attendance ID: {}", attendanceId);

        return attendanceId;
    }
}
