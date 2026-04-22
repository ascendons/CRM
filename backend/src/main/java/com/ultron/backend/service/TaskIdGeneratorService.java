package com.ultron.backend.service;

import org.springframework.stereotype.Service;

/**
 * Service to generate unique Task IDs using timestamp
 * Format: TASK-timestamp
 */
@Service
public class TaskIdGeneratorService {

    public synchronized String generateTaskId() {
        long timestamp = System.currentTimeMillis();
        return String.format("TASK-%d", timestamp);
    }
}
