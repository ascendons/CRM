/**
 * Subdomain utilities for multi-tenant URL handling
 */

/**
 * Extract subdomain from hostname
 * Examples:
 *   acme.yourcrm.com -> acme
 *   localhost -> null (development)
 *   yourcrm.com -> null (main domain)
 */
export function extractSubdomain(hostname: string): string | null {
    // Development: localhost or 127.0.0.1
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost:')) {
        // Check for subdomain in development (e.g., acme.localhost:3000)
        if (hostname.includes('.localhost')) {
            const parts = hostname.split('.');
            return parts[0];
        }
        return null; // No subdomain in local dev
    }

    // Production: subdomain.yourcrm.com
    const parts = hostname.split('.');

    // Need at least subdomain.domain.tld (3 parts)
    if (parts.length < 3) {
        return null;
    }

    const subdomain = parts[0];

    // Ignore 'www' subdomain
    if (subdomain === 'www') {
        return null;
    }

    return subdomain;
}

/**
 * Build URL with subdomain
 */
export function buildSubdomainUrl(subdomain: string, path: string = ''): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'yourcrm.com';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

    return `${protocol}://${subdomain}.${baseUrl}${path}`;
}

/**
 * Validate subdomain format
 * Rules:
 * - 3-20 characters
 * - Lowercase alphanumeric + hyphens
 * - Cannot start or end with hyphen
 * - Cannot be reserved words
 */
export function validateSubdomain(subdomain: string): {
    valid: boolean;
    error?: string;
} {
    // Reserved subdomains
    const reserved = [
        'www', 'api', 'admin', 'app', 'mail', 'ftp', 'localhost',
        'staging', 'dev', 'test', 'demo', 'dashboard', 'blog',
        'help', 'support', 'docs', 'status', 'about', 'contact'
    ];

    if (reserved.includes(subdomain.toLowerCase())) {
        return {
            valid: false,
            error: `"${subdomain}" is a reserved subdomain`
        };
    }

    // Length check
    if (subdomain.length < 3 || subdomain.length > 20) {
        return {
            valid: false,
            error: 'Subdomain must be 3-20 characters long'
        };
    }

    // Format check
    const regex = /^[a-z0-9]([a-z0-9-]{1,18}[a-z0-9])?$/;
    if (!regex.test(subdomain)) {
        return {
            valid: false,
            error: 'Subdomain must contain only lowercase letters, numbers, and hyphens. Cannot start or end with hyphen.'
        };
    }

    return { valid: true };
}

/**
 * Get current subdomain from window location
 */
export function getCurrentSubdomain(): string | null {
    if (typeof window === 'undefined') return null;
    return extractSubdomain(window.location.hostname);
}
