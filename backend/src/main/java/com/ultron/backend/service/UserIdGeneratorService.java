package com.ultron.backend.service;

import org.springframework.stereotype.Service;

/**
 * Service to generate unique User IDs using timestamp
 * Format: USR-timestamp
 * Example: USR-1773242807123
 */
@Service
public class UserIdGeneratorService {

    public synchronized String generateUserId() {
        long timestamp = System.currentTimeMillis();
        return String.format("USR-%d", timestamp);
    }
}
