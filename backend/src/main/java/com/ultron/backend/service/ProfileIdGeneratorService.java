package com.ultron.backend.service;

import org.springframework.stereotype.Service;

/**
 * Service to generate unique Profile IDs using timestamp
 * Format: PROFILE-timestamp
 * Example: PROFILE-1773242807123
 */
@Service
public class ProfileIdGeneratorService {

    public synchronized String generateProfileId() {
        long timestamp = System.currentTimeMillis();
        return String.format("PROFILE-%d", timestamp);
    }
}
