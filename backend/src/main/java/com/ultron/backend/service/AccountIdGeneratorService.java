package com.ultron.backend.service;

import org.springframework.stereotype.Service;

/**
 * Service to generate unique Account IDs using timestamp
 * Format: ACC-timestamp
 * Example: ACC-1773242807123
 */
@Service
public class AccountIdGeneratorService {

    public synchronized String generateAccountId() {
        long timestamp = System.currentTimeMillis();
        return String.format("ACC-%d", timestamp);
    }
}
