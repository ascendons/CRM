package com.ultron.backend.service;

import org.springframework.stereotype.Service;

/**
 * Service to generate unique Proposal IDs using timestamp
 * Format: PROP-timestamp
 * Example: PROP-1773242807123
 */
@Service
public class ProposalIdGeneratorService {

    public synchronized String generateProposalId() {
        long timestamp = System.currentTimeMillis();
        return String.format("PROP-%d", timestamp);
    }
}
