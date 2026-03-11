package com.ultron.backend.service;

import org.springframework.stereotype.Service;

/**
 * Service to generate unique Organization IDs using timestamp
 * Format: ORG-timestamp
 * Example: ORG-1773242807123
 */
@Service
public class OrganizationIdGeneratorService {

    public synchronized String generateOrganizationId() {
        long timestamp = System.currentTimeMillis();
        return String.format("ORG-%d", timestamp);
    }
}
