package com.ultron.backend.service;

import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * Service to generate unique Role IDs in format: ROLE-XXXXX
 * Example: ROLE-00125
 */
@Service
public class RoleIdGeneratorService {

    private final AtomicInteger counter = new AtomicInteger(0);

    public synchronized String generateRoleId() {
        int sequence = counter.incrementAndGet();
        return String.format("ROLE-%05d", sequence);
    }
}
