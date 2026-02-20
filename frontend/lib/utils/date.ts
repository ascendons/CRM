/**
 * Centralized Date Utility for IST (Indian Standard Time - Asia/Kolkata)
 *
 * All date/time operations in the application should use IST timezone
 * This utility ensures consistent timezone handling across the frontend
 *
 * Usage:
 * - Use formatDateIST() to format dates displayed to users
 * - Use formatDateTimeIST() for date-time displays
 * - Use formatRelativeTimeIST() for "X minutes ago" style displays
 * - Use parseToIST() to parse dates from backend
 */

import { format, formatDistanceToNow, parseISO, formatDistance, isToday, isYesterday, differenceInDays } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

// IST Timezone constant
export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Convert a date string or Date object to IST timezone
 * @param date - Date string (ISO format) or Date object
 * @returns Date object in IST timezone
 */
export function toIST(date: string | Date): Date {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return toZonedTime(dateObj, IST_TIMEZONE);
}

/**
 * Format a date in IST timezone with custom format
 * @param date - Date string or Date object
 * @param formatString - Date format string (e.g., 'dd/MM/yyyy', 'PPP', 'Pp')
 * @returns Formatted date string in IST
 */
export function formatInIST(date: string | Date, formatString: string = 'dd/MM/yyyy'): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatInTimeZone(dateObj, IST_TIMEZONE, formatString);
}

/**
 * Format a date as DD/MM/YYYY in IST
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "21/02/2026")
 */
export function formatDateIST(date: string | Date): string {
    return formatInIST(date, 'dd/MM/yyyy');
}

/**
 * Format a date-time as DD/MM/YYYY HH:mm in IST
 * @param date - Date string or Date object
 * @returns Formatted date-time string (e.g., "21/02/2026 14:30")
 */
export function formatDateTimeIST(date: string | Date): string {
    return formatInIST(date, 'dd/MM/yyyy HH:mm');
}

/**
 * Format a date-time with seconds as DD/MM/YYYY HH:mm:ss in IST
 * @param date - Date string or Date object
 * @returns Formatted date-time string (e.g., "21/02/2026 14:30:45")
 */
export function formatDateTimeFullIST(date: string | Date): string {
    return formatInIST(date, 'dd/MM/yyyy HH:mm:ss');
}

/**
 * Format a time as HH:mm in IST
 * @param date - Date string or Date object
 * @returns Formatted time string (e.g., "14:30")
 */
export function formatTimeIST(date: string | Date): string {
    return formatInIST(date, 'HH:mm');
}

/**
 * Format a time with seconds as HH:mm:ss in IST
 * @param date - Date string or Date object
 * @returns Formatted time string (e.g., "14:30:45")
 */
export function formatTimeFullIST(date: string | Date): string {
    return formatInIST(date, 'HH:mm:ss');
}

/**
 * Format a date in a human-readable format (e.g., "21 February 2026")
 * @param date - Date string or Date object
 * @returns Formatted date string in IST
 */
export function formatDateLongIST(date: string | Date): string {
    return formatInIST(date, 'dd MMMM yyyy');
}

/**
 * Format a date-time in a human-readable format (e.g., "21 Feb 2026, 14:30")
 * @param date - Date string or Date object
 * @returns Formatted date-time string in IST
 */
export function formatDateTimeLongIST(date: string | Date): string {
    return formatInIST(date, 'dd MMM yyyy, HH:mm');
}

/**
 * Format a date for locale string with en-IN format
 * @param date - Date string or Date object
 * @returns Formatted date string using en-IN locale
 */
export function formatLocaleIST(date: string | Date): string {
    const istDate = toIST(date);
    return istDate.toLocaleString('en-IN', {
        timeZone: IST_TIMEZONE,
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

/**
 * Format relative time (e.g., "5 minutes ago", "2 hours ago")
 * @param date - Date string or Date object
 * @param options - Options for formatDistanceToNow
 * @returns Relative time string (e.g., "5 minutes ago")
 */
export function formatRelativeTimeIST(
    date: string | Date,
    options?: { addSuffix?: boolean; includeSeconds?: boolean }
): string {
    const istDate = toIST(date);
    return formatDistanceToNow(istDate, {
        addSuffix: true,
        includeSeconds: true,
        ...options,
    });
}

/**
 * Format distance between two dates (e.g., "5 minutes", "2 hours")
 * @param date - Start date string or Date object
 * @param baseDate - End date string or Date object
 * @returns Distance string
 */
export function formatDistanceIST(date: string | Date, baseDate: string | Date): string {
    const istDate1 = toIST(date);
    const istDate2 = toIST(baseDate);
    return formatDistance(istDate1, istDate2);
}

/**
 * Check if a date is today in IST
 * @param date - Date string or Date object
 * @returns true if date is today in IST
 */
export function isTodayIST(date: string | Date): boolean {
    const istDate = toIST(date);
    const istNow = toIST(new Date());
    return isToday(istDate);
}

/**
 * Check if a date is yesterday in IST
 * @param date - Date string or Date object
 * @returns true if date is yesterday in IST
 */
export function isYesterdayIST(date: string | Date): boolean {
    const istDate = toIST(date);
    return isYesterday(istDate);
}

/**
 * Get the difference in days between two dates in IST
 * @param laterDate - Later date string or Date object
 * @param earlierDate - Earlier date string or Date object
 * @returns Number of days difference
 */
export function daysDifferenceIST(laterDate: string | Date, earlierDate: string | Date): number {
    const istDate1 = toIST(laterDate);
    const istDate2 = toIST(earlierDate);
    return differenceInDays(istDate1, istDate2);
}

/**
 * Format date for display with smart formatting
 * - Shows "Today, HH:mm" for today
 * - Shows "Yesterday, HH:mm" for yesterday
 * - Shows "DD MMM, HH:mm" for this year
 * - Shows "DD MMM YYYY, HH:mm" for other years
 *
 * @param date - Date string or Date object
 * @returns Smart formatted date string in IST
 */
export function formatSmartDateIST(date: string | Date): string {
    const istDate = toIST(date);
    const istNow = toIST(new Date());

    if (isTodayIST(istDate)) {
        return `Today, ${formatTimeIST(istDate)}`;
    }

    if (isYesterdayIST(istDate)) {
        return `Yesterday, ${formatTimeIST(istDate)}`;
    }

    const daysDiff = differenceInDays(istNow, istDate);

    if (daysDiff <= 7) {
        return formatInIST(istDate, 'EEEE, HH:mm'); // e.g., "Monday, 14:30"
    }

    if (istDate.getFullYear() === istNow.getFullYear()) {
        return formatInIST(istDate, 'dd MMM, HH:mm'); // e.g., "21 Feb, 14:30"
    }

    return formatInIST(istDate, 'dd MMM yyyy, HH:mm'); // e.g., "21 Feb 2026, 14:30"
}

/**
 * Get current date-time in IST
 * @returns Current Date object in IST
 */
export function nowIST(): Date {
    return toIST(new Date());
}

/**
 * Parse a date string to Date object in IST
 * @param dateString - ISO date string
 * @returns Date object in IST
 */
export function parseToIST(dateString: string): Date {
    return toIST(dateString);
}

/**
 * Convert a Date object to ISO string in IST
 * @param date - Date object
 * @returns ISO date string
 */
export function toISOStringIST(date: Date): string {
    return formatInTimeZone(date, IST_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
}

/**
 * Format date for input fields (YYYY-MM-DD)
 * @param date - Date string or Date object
 * @returns Formatted date string for input fields
 */
export function formatForInputIST(date: string | Date): string {
    return formatInIST(date, 'yyyy-MM-dd');
}

/**
 * Format date-time for input fields (YYYY-MM-DDTHH:mm)
 * @param date - Date string or Date object
 * @returns Formatted date-time string for input fields
 */
export function formatForDateTimeInputIST(date: string | Date): string {
    return formatInIST(date, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Format a date for API requests (ISO format in IST)
 * @param date - Date string or Date object
 * @returns ISO formatted date string in IST
 */
export function formatForAPIIST(date: string | Date): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return toISOStringIST(dateObj);
}
