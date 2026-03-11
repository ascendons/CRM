package com.ultron.backend.service.catalog;

import org.springframework.stereotype.Service;

/**
 * Service to generate unique Dynamic Product IDs using timestamp
 * Format: DPRD-timestamp
 * Example: DPRD-1773242807123
 */
@Service
public class DynamicProductIdGeneratorService {

    public synchronized String generateProductId() {
        long timestamp = System.currentTimeMillis();
        return String.format("DPRD-%d", timestamp);
    }
}
