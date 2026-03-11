package com.ultron.backend.service;

import org.springframework.stereotype.Service;

/**
 * Service to generate unique Role IDs using timestamp
 * Format: ROLE-timestamp
 * Example: ROLE-1773242807123
 */
@Service
public class RoleIdGeneratorService {

    public synchronized String generateRoleId() {
        long timestamp = System.currentTimeMillis();
        return String.format("ROLE-%d", timestamp);
    }
}
