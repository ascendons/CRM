package com.ultron.backend.service;

import org.springframework.stereotype.Service;

/**
 * Service to generate unique Regularization IDs using timestamp
 * Format: REG-timestamp
 * Example: REG-1773242807123
 */
@Service
public class RegularizationIdGeneratorService {

    public synchronized String generateRegularizationId() {
        long timestamp = System.currentTimeMillis();
        return String.format("REG-%d", timestamp);
    }
}
