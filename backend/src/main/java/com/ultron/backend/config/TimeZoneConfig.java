package com.ultron.backend.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;

import java.time.ZoneId;
import java.util.TimeZone;

/**
 * Global timezone configuration for the application
 * Sets the default timezone to IST (Indian Standard Time - Asia/Kolkata)
 *
 * This ensures:
 * - All LocalDateTime.now() calls use IST
 * - JVM default timezone is set to IST
 * - Database operations use IST
 * - Consistent timezone handling across the application
 */
@Configuration
@Slf4j
public class TimeZoneConfig {

    public static final String DEFAULT_TIMEZONE = "Asia/Kolkata";
    public static final ZoneId DEFAULT_ZONE_ID = ZoneId.of(DEFAULT_TIMEZONE);

    @PostConstruct
    public void init() {
        // Set JVM default timezone to IST
        TimeZone.setDefault(TimeZone.getTimeZone(DEFAULT_ZONE_ID));

        log.info("Application timezone set to: {} (IST - Indian Standard Time)", DEFAULT_TIMEZONE);
        log.info("Current date/time in IST: {}", java.time.LocalDateTime.now());
    }
}
