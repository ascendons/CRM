package com.ultron.backend.service;

import org.springframework.stereotype.Service;

/**
 * Service to generate unique Activity IDs using timestamp
 * Format: ACT-timestamp
 * Example: ACT-1773242807123
 */
@Service
public class ActivityIdGeneratorService {

    public synchronized String generateActivityId() {
        long timestamp = System.currentTimeMillis();
        return String.format("ACT-%d", timestamp);
    }
}
