package com.ultron.backend.service;

import org.springframework.stereotype.Service;

/**
 * Service to generate unique Leave IDs using timestamp
 * Format: LVE-timestamp
 * Example: LVE-1773242807123
 */
@Service
public class LeaveIdGeneratorService {

    public synchronized String generateLeaveId() {
        long timestamp = System.currentTimeMillis();
        return String.format("LVE-%d", timestamp);
    }
}
