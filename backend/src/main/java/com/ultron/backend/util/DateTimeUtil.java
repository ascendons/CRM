package com.ultron.backend.util;

import com.ultron.backend.config.TimeZoneConfig;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

/**
 * Utility class for consistent date/time operations in IST timezone
 *
 * All date/time operations in the application should use IST (Asia/Kolkata)
 * This utility ensures consistent timezone handling across the backend
 */
public class DateTimeUtil {

    // Formatters
    public static final DateTimeFormatter ISO_DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
    public static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    public static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm:ss");
    public static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    /**
     * Get current date/time in IST
     * Use this instead of LocalDateTime.now()
     */
    public static LocalDateTime now() {
        return LocalDateTime.now(TimeZoneConfig.DEFAULT_ZONE_ID);
    }

    /**
     * Get current date in IST
     */
    public static LocalDate today() {
        return LocalDate.now(TimeZoneConfig.DEFAULT_ZONE_ID);
    }

    /**
     * Get current time in IST
     */
    public static LocalTime currentTime() {
        return LocalTime.now(TimeZoneConfig.DEFAULT_ZONE_ID);
    }

    /**
     * Get current timestamp as ZonedDateTime in IST
     */
    public static ZonedDateTime nowZoned() {
        return ZonedDateTime.now(TimeZoneConfig.DEFAULT_ZONE_ID);
    }

    /**
     * Convert LocalDateTime to IST ZonedDateTime
     */
    public static ZonedDateTime toISTZonedDateTime(LocalDateTime dateTime) {
        return dateTime.atZone(TimeZoneConfig.DEFAULT_ZONE_ID);
    }

    /**
     * Convert epoch milliseconds to LocalDateTime in IST
     */
    public static LocalDateTime fromEpochMillis(long epochMillis) {
        return LocalDateTime.ofInstant(
                Instant.ofEpochMilli(epochMillis),
                TimeZoneConfig.DEFAULT_ZONE_ID
        );
    }

    /**
     * Convert LocalDateTime to epoch milliseconds in IST
     */
    public static long toEpochMillis(LocalDateTime dateTime) {
        return dateTime.atZone(TimeZoneConfig.DEFAULT_ZONE_ID).toInstant().toEpochMilli();
    }

    /**
     * Format LocalDateTime to ISO string
     */
    public static String formatISO(LocalDateTime dateTime) {
        return dateTime.format(ISO_DATE_TIME_FORMATTER);
    }

    /**
     * Format LocalDateTime to DD/MM/YYYY HH:mm:ss
     */
    public static String formatDateTime(LocalDateTime dateTime) {
        return dateTime.format(DATE_TIME_FORMATTER);
    }

    /**
     * Format LocalDate to DD/MM/YYYY
     */
    public static String formatDate(LocalDate date) {
        return date.format(DATE_FORMATTER);
    }

    /**
     * Format LocalTime to HH:mm:ss
     */
    public static String formatTime(LocalTime time) {
        return time.format(TIME_FORMATTER);
    }

    /**
     * Parse ISO date-time string to LocalDateTime
     */
    public static LocalDateTime parseISO(String dateTimeString) {
        return LocalDateTime.parse(dateTimeString, ISO_DATE_TIME_FORMATTER);
    }

    /**
     * Check if date is in the past (IST)
     */
    public static boolean isPast(LocalDateTime dateTime) {
        return dateTime.isBefore(now());
    }

    /**
     * Check if date is in the future (IST)
     */
    public static boolean isFuture(LocalDateTime dateTime) {
        return dateTime.isAfter(now());
    }

    /**
     * Check if date is today (IST)
     */
    public static boolean isToday(LocalDateTime dateTime) {
        LocalDate date = dateTime.toLocalDate();
        return date.equals(today());
    }

    /**
     * Get start of day in IST
     */
    public static LocalDateTime startOfDay(LocalDate date) {
        return date.atStartOfDay();
    }

    /**
     * Get end of day in IST
     */
    public static LocalDateTime endOfDay(LocalDate date) {
        return date.atTime(LocalTime.MAX);
    }

    /**
     * Get start of current day in IST
     */
    public static LocalDateTime startOfToday() {
        return startOfDay(today());
    }

    /**
     * Get end of current day in IST
     */
    public static LocalDateTime endOfToday() {
        return endOfDay(today());
    }

    /**
     * Calculate days between two dates
     */
    public static long daysBetween(LocalDateTime start, LocalDateTime end) {
        return ChronoUnit.DAYS.between(start, end);
    }

    /**
     * Calculate hours between two dates
     */
    public static long hoursBetween(LocalDateTime start, LocalDateTime end) {
        return ChronoUnit.HOURS.between(start, end);
    }

    /**
     * Calculate minutes between two dates
     */
    public static long minutesBetween(LocalDateTime start, LocalDateTime end) {
        return ChronoUnit.MINUTES.between(start, end);
    }

    /**
     * Add days to a date
     */
    public static LocalDateTime addDays(LocalDateTime dateTime, long days) {
        return dateTime.plusDays(days);
    }

    /**
     * Add hours to a date
     */
    public static LocalDateTime addHours(LocalDateTime dateTime, long hours) {
        return dateTime.plusHours(hours);
    }

    /**
     * Add minutes to a date
     */
    public static LocalDateTime addMinutes(LocalDateTime dateTime, long minutes) {
        return dateTime.plusMinutes(minutes);
    }

    /**
     * Subtract days from a date
     */
    public static LocalDateTime subtractDays(LocalDateTime dateTime, long days) {
        return dateTime.minusDays(days);
    }

    /**
     * Get date range for a specific period
     */
    public static LocalDateTime[] getDateRange(String period) {
        LocalDateTime now = now();
        LocalDateTime start;

        switch (period.toUpperCase()) {
            case "TODAY":
                start = startOfToday();
                break;
            case "YESTERDAY":
                start = startOfDay(today().minusDays(1));
                now = endOfDay(today().minusDays(1));
                break;
            case "THIS_WEEK":
                start = startOfDay(today().minusDays(today().getDayOfWeek().getValue() - 1));
                break;
            case "THIS_MONTH":
                start = startOfDay(today().withDayOfMonth(1));
                break;
            case "LAST_30_DAYS":
                start = now.minusDays(30);
                break;
            case "LAST_90_DAYS":
                start = now.minusDays(90);
                break;
            case "THIS_YEAR":
                start = startOfDay(today().withDayOfYear(1));
                break;
            default:
                start = startOfToday();
        }

        return new LocalDateTime[]{start, now};
    }

    private DateTimeUtil() {
        // Utility class - prevent instantiation
    }
}
