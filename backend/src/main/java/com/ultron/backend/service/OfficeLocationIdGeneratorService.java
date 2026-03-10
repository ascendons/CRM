package com.ultron.backend.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Service to generate unique Office Location IDs using timestamp format: LOC-YYYYMMDDHHmmss
 * Example: LOC-20260310193045
 * Timezone: Asia/Kolkata (IST)
 */
@Service
public class OfficeLocationIdGeneratorService {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final ZoneId IST_ZONE = ZoneId.of("Asia/Kolkata");

    public String generateLocationId() {
        LocalDateTime now = LocalDateTime.now(IST_ZONE);
        String timestamp = now.format(FORMATTER);
        return "LOC-" + timestamp;
    }
}
