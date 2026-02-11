package com.ultron.backend.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Slf4j
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    /**
     * Generate JWT token with tenant ID and dynamic role/profile IDs (Multi-tenant + RBAC support)
     * @param userId User ID
     * @param email User email
     * @param role User role (legacy enum, kept for backward compatibility)
     * @param roleId Dynamic role ID from database (ROLE-XXXXX)
     * @param profileId Dynamic profile ID from database (PROFILE-XXXXX)
     * @param tenantId Organization/Tenant ID
     * @return JWT token
     */
    public String generateToken(String userId, String email, String role, String roleId, String profileId, String tenantId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("email", email);
        claims.put("role", role);  // Legacy enum
        claims.put("roleId", roleId);  // NEW: Dynamic role ID
        claims.put("profileId", profileId);  // NEW: Dynamic profile ID
        claims.put("tenantId", tenantId);  // Multi-tenancy claim
        return createToken(claims, userId);
    }

    /**
     * Backward compatibility - delegates to new method with default roleId/profileId
     * @deprecated Use generateToken(userId, email, role, roleId, profileId, tenantId) instead
     */
    @Deprecated
    public String generateToken(String userId, String email, String role, String tenantId) {
        log.warn("generateToken called without roleId/profileId for user: {} - using legacy role enum", userId);
        return generateToken(userId, email, role, null, null, tenantId);
    }

    /**
     * Backward compatibility - delegates to new method with default tenantId
     * @deprecated Use generateToken(userId, email, role, tenantId) instead
     */
    @Deprecated
    public String generateToken(String userId, String email, String role) {
        // For backward compatibility during migration, use "DEFAULT" as tenantId
        log.warn("generateToken called without tenantId for user: {} - using DEFAULT tenant", userId);
        return generateToken(userId, email, role, "DEFAULT");
    }

    private String createToken(Map<String, Object> claims, String subject) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public String extractUserId(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractEmail(String token) {
        return extractClaim(token, claims -> claims.get("email", String.class));
    }

    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    /**
     * Extract dynamic role ID from JWT token (RBAC)
     * @param token JWT token
     * @return Role ID (ROLE-XXXXX)
     */
    public String extractRoleId(String token) {
        return extractClaim(token, claims -> claims.get("roleId", String.class));
    }

    /**
     * Extract dynamic profile ID from JWT token (RBAC)
     * @param token JWT token
     * @return Profile ID (PROFILE-XXXXX)
     */
    public String extractProfileId(String token) {
        return extractClaim(token, claims -> claims.get("profileId", String.class));
    }

    /**
     * Extract tenant ID from JWT token
     * CRITICAL: Used for tenant context initialization
     * @param token JWT token
     * @return Tenant ID
     */
    public String extractTenantId(String token) {
        return extractClaim(token, claims -> claims.get("tenantId", String.class));
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isTokenValid(String token) {
        try {
            return !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
}
