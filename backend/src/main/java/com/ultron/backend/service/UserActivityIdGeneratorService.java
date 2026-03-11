package com.ultron.backend.service;

import org.springframework.stereotype.Service;

/**
 * Service to generate unique User Activity IDs using timestamp
 * Format: UACT-timestamp
 * Example: UACT-1773242807123
 */
@Service
public class UserActivityIdGeneratorService {

    public synchronized String generateActivityId() {
        long timestamp = System.currentTimeMillis();
        return String.format("UACT-%d", timestamp);
    }
}
