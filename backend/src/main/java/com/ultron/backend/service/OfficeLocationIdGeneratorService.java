package com.ultron.backend.service;

import org.springframework.stereotype.Service;

/**
 * Service to generate unique Office Location IDs using timestamp
 * Format: LOC-timestamp
 * Example: LOC-1773242807123
 */
@Service
public class OfficeLocationIdGeneratorService {

    public synchronized String generateLocationId() {
        long timestamp = System.currentTimeMillis();
        return String.format("LOC-%d", timestamp);
    }
}
