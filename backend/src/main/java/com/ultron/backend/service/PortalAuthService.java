package com.ultron.backend.service;

import com.ultron.backend.domain.entity.PortalSession;
import com.ultron.backend.repository.PortalSessionRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PortalAuthService {

    private final PortalSessionRepository portalSessionRepository;

    @Value("${jwt.secret}")
    private String jwtSecret;

    private SecretKey getKey() {
        String portalSecret = jwtSecret + "_PORTAL";
        byte[] keyBytes = portalSecret.getBytes();
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
            return Keys.hmacShaKeyFor(padded);
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String requestMagicLink(String customerEmail, String tenantId) {
        String token = UUID.randomUUID().toString();
        PortalSession session = PortalSession.builder()
                .tenantId(tenantId)
                .customerEmail(customerEmail)
                .magicToken(token)
                .used(false)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .createdAt(LocalDateTime.now())
                .build();
        portalSessionRepository.save(session);
        log.info("Magic link created for {} tenant {}: token={}", customerEmail, tenantId, token);
        return token;
    }

    public Map<String, String> verifyMagicLink(String token) {
        PortalSession session = portalSessionRepository.findByMagicToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid magic link"));

        if (session.isUsed()) throw new RuntimeException("Magic link already used");
        if (session.getExpiresAt().isBefore(LocalDateTime.now())) throw new RuntimeException("Magic link expired");

        session.setUsed(true);
        portalSessionRepository.save(session);

        String portalJwt = Jwts.builder()
                .subject(session.getCustomerEmail())
                .claim("tenantId", session.getTenantId())
                .claim("portalType", "CUSTOMER")
                .claim("email", session.getCustomerEmail())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 24 * 60 * 60 * 1000))
                .signWith(getKey())
                .compact();

        Map<String, String> result = new HashMap<>();
        result.put("token", portalJwt);
        result.put("email", session.getCustomerEmail());
        return result;
    }

    public Map<String, Object> validatePortalToken(String jwt) {
        try {
            var claims = Jwts.parser().verifyWith(getKey()).build().parseSignedClaims(jwt).getPayload();
            Map<String, Object> info = new HashMap<>();
            info.put("email", claims.get("email", String.class));
            info.put("tenantId", claims.get("tenantId", String.class));
            return info;
        } catch (Exception e) {
            throw new RuntimeException("Invalid portal token");
        }
    }
}
