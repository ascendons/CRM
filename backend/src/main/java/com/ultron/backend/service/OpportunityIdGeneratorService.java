package com.ultron.backend.service;

import org.springframework.stereotype.Service;

/**
 * Service to generate unique Opportunity IDs using timestamp
 * Format: OPP-timestamp
 * Example: OPP-1773242807123
 */
@Service
public class OpportunityIdGeneratorService {

    public synchronized String generateOpportunityId() {
        long timestamp = System.currentTimeMillis();
        return String.format("OPP-%d", timestamp);
    }
}
