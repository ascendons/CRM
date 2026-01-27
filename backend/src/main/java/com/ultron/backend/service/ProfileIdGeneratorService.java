package com.ultron.backend.service;

import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * Service to generate unique Profile IDs in format: PROFILE-XXXXX
 * Example: PROFILE-00125
 */
@Service
public class ProfileIdGeneratorService {

    private final AtomicInteger counter = new AtomicInteger(0);

    public synchronized String generateProfileId() {
        int sequence = counter.incrementAndGet();
        return String.format("PROFILE-%05d", sequence);
    }
}
