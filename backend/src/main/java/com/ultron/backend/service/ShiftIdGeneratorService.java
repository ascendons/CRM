package com.ultron.backend.service;

import org.springframework.stereotype.Service;

/**
 * Service to generate unique Shift IDs using timestamp
 * Format: SFT-timestamp
 * Example: SFT-1773242807123
 */
@Service
public class ShiftIdGeneratorService {

    public synchronized String generateShiftId() {
        long timestamp = System.currentTimeMillis();
        return String.format("SFT-%d", timestamp);
    }
}
