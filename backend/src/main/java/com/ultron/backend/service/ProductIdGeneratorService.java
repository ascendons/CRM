package com.ultron.backend.service;

import org.springframework.stereotype.Service;

/**
 * Service to generate unique Product IDs using timestamp
 * Format: PRD-timestamp
 * Example: PRD-1773242807123
 */
@Service
public class ProductIdGeneratorService {

    public synchronized String generateProductId() {
        long timestamp = System.currentTimeMillis();
        return String.format("PRD-%d", timestamp);
    }
}
