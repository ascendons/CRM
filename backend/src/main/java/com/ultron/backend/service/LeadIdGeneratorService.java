package com.ultron.backend.service;

import org.springframework.stereotype.Service;

/**
 * Service to generate unique Lead IDs using timestamp
 * Format: LEAD-timestamp
 * Example: LEAD-1773242807123
 */
@Service
public class LeadIdGeneratorService {

    public synchronized String generateLeadId() {
        long timestamp = System.currentTimeMillis();
        return String.format("LEAD-%d", timestamp);
    }
}
