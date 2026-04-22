package com.ultron.backend.service;

import org.springframework.stereotype.Service;

/**
 * Service to generate unique KB Article IDs using timestamp
 * Format: KB-timestamp
 */
@Service
public class KbArticleIdGeneratorService {

    public synchronized String generateArticleId() {
        long timestamp = System.currentTimeMillis();
        return String.format("KB-%d", timestamp);
    }

    public synchronized String generateCategoryId() {
        long timestamp = System.currentTimeMillis();
        return String.format("KBC-%d", timestamp);
    }
}
