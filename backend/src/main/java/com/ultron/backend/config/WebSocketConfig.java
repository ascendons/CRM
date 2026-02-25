package com.ultron.backend.config;

import com.ultron.backend.multitenancy.TenantContext;
import com.ultron.backend.service.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Collections;
import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Slf4j
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtService jwtService;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(allowedOrigins.split(","))
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    List<String> authorization = accessor.getNativeHeader("Authorization");
                    if (authorization != null && !authorization.isEmpty()) {
                        String authHeader = authorization.get(0);
                        if (authHeader.startsWith("Bearer ")) {
                            String token = authHeader.substring(7);
                            try {
                                if (jwtService.isTokenValid(token)) {
                                    String userId = jwtService.extractUserId(token);
                                    String role = jwtService.extractRole(token);
                                    String tenantId = jwtService.extractTenantId(token);

                                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                            userId, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))
                                    );
                                    
                                    accessor.setUser(authentication);
                                    
                                    // Make sure we pass the tenantId and userId to the session attributes so they can be accessed later
                                    accessor.getSessionAttributes().put("tenantId", tenantId);
                                    accessor.getSessionAttributes().put("userId", userId);
                                    
                                    log.debug("WebSocket authenticated for user: {}", userId);
                                }
                            } catch (Exception e) {
                                log.error("WebSocket Authentication failed", e);
                            }
                        }
                    }
                }
                
                // For other messages, we need to extract tenant information from the session attributes and populate the ThreadLocal
                if (accessor != null && accessor.getSessionAttributes() != null) {
                    String tenantId = (String) accessor.getSessionAttributes().get("tenantId");
                    String userId = (String) accessor.getSessionAttributes().get("userId");
                    if (tenantId != null) {
                        TenantContext.setTenantId(tenantId);
                        TenantContext.setUserId(userId);
                    }
                }
                
                return message;
            }

            @Override
            public void postSend(Message<?> message, MessageChannel channel, boolean sent) {
                TenantContext.clear();
            }
        });
    }
}
