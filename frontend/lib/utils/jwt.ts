interface JWTPayload {
    sub: string;        // userId
    email: string;
    role: string;
    tenantId?: string;  // Multi-tenancy claim
    exp: number;
    iat: number;
}

/**
 * Base64 URL decode
 */
function base64UrlDecode(str: string): string {
    // Replace URL-safe characters
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

    // Add padding
    while (base64.length % 4) {
        base64 += '=';
    }

    try {
        return decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
    } catch {
        return '';
    }
}

/**
 * Decode JWT token
 */
export function decodeJWT(token: string): JWTPayload | null {
    try {
        const parts = token.split('.');

        if (parts.length !== 3) {
            console.error('Invalid JWT format');
            return null;
        }

        const payload = base64UrlDecode(parts[1]);
        return JSON.parse(payload) as JWTPayload;
    } catch (error) {
        console.error('Failed to decode JWT:', error);
        return null;
    }
}

/**
 * Extract tenantId from JWT
 */
export function extractTenantId(token: string): string | null {
    const payload = decodeJWT(token);
    return payload?.tenantId || null;
}

/**
 * Extract userId from JWT
 */
export function extractUserId(token: string): string | null {
    const payload = decodeJWT(token);
    return payload?.sub || null;
}

/**
 * Extract email from JWT
 */
export function extractEmail(token: string): string | null {
    const payload = decodeJWT(token);
    return payload?.email || null;
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
    const payload = decodeJWT(token);
    if (!payload) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
}

/**
 * Validate token has required multi-tenancy fields
 */
export function validateToken(token: string): boolean {
    const payload = decodeJWT(token);

    if (!payload) {
        console.error('Invalid JWT payload');
        return false;
    }

    // Must have tenantId for multi-tenancy
    if (!payload.tenantId) {
        console.error('JWT missing tenantId claim - multi-tenancy not supported');
        return false;
    }

    // Check expiry
    if (isTokenExpired(token)) {
        console.error('JWT token expired');
        return false;
    }

    return true;
}

/**
 * Get time until token expires (in seconds)
 */
export function getTokenExpiryTime(token: string): number {
    const payload = decodeJWT(token);
    if (!payload) return 0;

    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - currentTime);
}

/**
 * Check if token will expire soon (within 5 minutes)
 */
export function isTokenExpiringSoon(token: string): boolean {
    const expiryTime = getTokenExpiryTime(token);
    return expiryTime > 0 && expiryTime < 300; // 5 minutes
}
