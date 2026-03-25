package com.ultron.backend.service.inventory;

import org.springframework.stereotype.Service;

/**
 * Service to generate unique transaction IDs
 */
@Service
public class TransactionIdGeneratorService {

    private static final String PREFIX = "TXN-";

    /**
     * Generate transaction ID: TXN-{timestamp}
     * Example: TXN-1710634567890
     */
    public synchronized String generateTransactionId() {
        return PREFIX + System.currentTimeMillis();
    }
}
