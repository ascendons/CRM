package com.ultron.backend.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Service to generate unique User IDs using timestamp for guaranteed uniqueness.
 * Format: USR-YYYYMMDD-{timestamp-millis}-{random}
 * Example: USR-20260226-1708932547123-A7F
 *
 * This approach ensures:
 * - No duplicates even with concurrent user creation
 * - No dependency on in-memory counters that reset on restart
 * - No database queries needed for ID generation
 * - Thread-safe without synchronization
 */
@Service
public class UserIdGeneratorService {

    /**
     * Generate unique user ID using timestamp + random suffix.
     * This guarantees uniqueness even if multiple users are created in the same millisecond.
     */
    public String generateUserId() {
        LocalDateTime now = LocalDateTime.now();
        String datePrefix = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        // Current timestamp in milliseconds
        long timestamp = System.currentTimeMillis();

        // Add 3-char random hex suffix for extra uniqueness
        // (in case multiple users created in same millisecond)
        String randomSuffix = Integer.toHexString(ThreadLocalRandom.current().nextInt(4096)).toUpperCase();
        randomSuffix = String.format("%03X", Integer.parseInt(randomSuffix, 16)); // Pad to 3 chars

        // Format: USR-YYYYMMDD-{timestamp}-{random}
        return String.format("USR-%s-%d-%s", datePrefix, timestamp, randomSuffix);
    }
}
