package com.ultron.backend.service;

import org.springframework.stereotype.Service;

/**
 * Service to generate unique Project IDs using timestamp
 * Format: PROJ-timestamp
 */
@Service
public class ProjectIdGeneratorService {

    public synchronized String generateProjectId() {
        long timestamp = System.currentTimeMillis();
        return String.format("PROJ-%d", timestamp);
    }
}
