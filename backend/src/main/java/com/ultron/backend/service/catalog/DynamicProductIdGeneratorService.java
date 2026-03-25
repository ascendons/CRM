package com.ultron.backend.service.catalog;

import org.springframework.stereotype.Service;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Service to generate unique Dynamic Product IDs using timestamp + counter
 * Format: DPRD-timestamp-sequence
 * Example: DPRD-1773242807123-001
 */
@Service
public class DynamicProductIdGeneratorService {

    private volatile long lastTimestamp = 0L;
    private final AtomicInteger sequence = new AtomicInteger(0);

    public synchronized String generateProductId() {
        long timestamp = System.currentTimeMillis();

        // If same millisecond, increment sequence
        if (timestamp == lastTimestamp) {
            int seq = sequence.incrementAndGet();
            return String.format("DPRD-%d-%03d", timestamp, seq);
        } else {
            // New millisecond, reset sequence
            lastTimestamp = timestamp;
            sequence.set(0);
            return String.format("DPRD-%d-000", timestamp);
        }
    }
}
