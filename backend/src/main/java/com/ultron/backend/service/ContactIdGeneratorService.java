package com.ultron.backend.service;

import org.springframework.stereotype.Service;

/**
 * Service to generate unique Contact IDs using timestamp
 * Format: CONT-timestamp
 * Example: CONT-1773242807123
 */
@Service
public class ContactIdGeneratorService {

    public synchronized String generateContactId() {
        long timestamp = System.currentTimeMillis();
        return String.format("CONT-%d", timestamp);
    }
}
