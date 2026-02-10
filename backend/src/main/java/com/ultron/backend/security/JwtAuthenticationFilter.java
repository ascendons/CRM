package com.ultron.backend.security;

import com.ultron.backend.multitenancy.TenantContext;
import com.ultron.backend.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        try {
            final String authHeader = request.getHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                filterChain.doFilter(request, response);
                return;
            }

            try {
                final String jwt = authHeader.substring(7);

                if (jwtService.isTokenValid(jwt)) {
                    String userId = jwtService.extractUserId(jwt);
                    String email = jwtService.extractEmail(jwt);
                    String role = jwtService.extractRole(jwt);
                    String tenantId = jwtService.extractTenantId(jwt);

                    // CRITICAL: Set tenant context BEFORE any business logic
                    if (tenantId != null) {
                        TenantContext.setTenantId(tenantId);
                        TenantContext.setUserId(userId);
                        TenantContext.setUserRole(role);
                        log.debug("Tenant context initialized - TenantId: {}, UserId: {}, Role: {}",
                                  tenantId, userId, role);
                    } else {
                        log.warn("JWT token missing tenantId claim - request will be rejected");
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"success\":false,\"message\":\"Invalid token: missing tenant information\"}");
                        return;
                    }

                    if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                userId,
                                null,
                                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))
                        );

                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);

                        // Set request attributes for backward compatibility
                        request.setAttribute("userId", userId);
                        request.setAttribute("userEmail", email);
                        request.setAttribute("userRole", role);
                        request.setAttribute("tenantId", tenantId);

                        log.debug("JWT authenticated - UserId: {}, Email: {}, Role: {}, TenantId: {}",
                                  userId, email, role, tenantId);
                    }
                }
            } catch (Exception e) {
                log.error("JWT authentication failed: {}", e.getMessage());
                TenantContext.clear();  // Clear on error
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"success\":false,\"message\":\"Invalid or expired token\"}");
                return;
            }

            filterChain.doFilter(request, response);

        } finally {
            // CRITICAL: Clean up ThreadLocal to prevent memory leaks
            TenantContext.clear();
            log.trace("TenantContext cleaned up after request");
        }
    }
}
