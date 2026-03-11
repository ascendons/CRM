package com.ultron.backend.service;

import org.springframework.stereotype.Service;

/**
 * Service to generate unique Attendance IDs using timestamp
 * Format: ATT-timestamp
 * Example: ATT-1773242807123
 */
@Service
public class AttendanceIdGeneratorService {

    public synchronized String generateAttendanceId() {
        long timestamp = System.currentTimeMillis();
        return String.format("ATT-%d", timestamp);
    }
}
