package com.ultron.backend.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Service to generate unique Proposal IDs in format: PROP-YYYY-MM-XXXXX
 * Example: PROP-2025-02-00001
 */
@Service
public class ProposalIdGeneratorService {

    private final AtomicInteger counter = new AtomicInteger(0);
    private String lastDate = "";

    public synchronized String generateProposalId() {
        LocalDateTime now = LocalDateTime.now();
        String currentDate = now.format(DateTimeFormatter.ofPattern("yyyy-MM"));

        // Reset counter if new month
        if (!currentDate.equals(lastDate)) {
            counter.set(0);
            lastDate = currentDate;
        }

        int sequence = counter.incrementAndGet();

        return String.format("PROP-%s-%05d", currentDate, sequence);
    }
}
