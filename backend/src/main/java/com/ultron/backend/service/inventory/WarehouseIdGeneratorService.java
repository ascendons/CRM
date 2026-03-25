package com.ultron.backend.service.inventory;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Service to generate unique warehouse codes
 */
@Service
public class WarehouseIdGeneratorService {

    private static final String PREFIX = "WH-";
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyyMM");

    /**
     * Generate warehouse code: WH-{YYYYMM}-{sequence}
     * Example: WH-202603-001
     */
    public synchronized String generateWarehouseCode() {
        String datePart = LocalDateTime.now().format(FORMATTER);
        String timestamp = String.valueOf(System.currentTimeMillis()).substring(7);
        return PREFIX + datePart + "-" + timestamp;
    }

    /**
     * Generate warehouse code with custom prefix
     */
    public synchronized String generateWarehouseCode(String customPrefix) {
        String datePart = LocalDateTime.now().format(FORMATTER);
        String timestamp = String.valueOf(System.currentTimeMillis()).substring(7);
        return customPrefix + "-" + datePart + "-" + timestamp;
    }
}
