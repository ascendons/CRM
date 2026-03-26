package com.ultron.backend.service.inventory;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Service to generate unique purchase order numbers
 */
@Service
public class PONumberGeneratorService {

    private static final String PREFIX = "PO-";
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy");

    /**
     * Generate PO number: PO-{YYYY}-{sequence}
     * Example: PO-2026-000123
     */
    public synchronized String generatePONumber() {
        String year = LocalDateTime.now().format(FORMATTER);
        String timestamp = String.valueOf(System.currentTimeMillis()).substring(6);
        return PREFIX + year + "-" + String.format("%06d", Long.parseLong(timestamp) % 1000000);
    }
}
