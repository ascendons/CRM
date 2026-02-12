package com.ultron.backend.scheduler;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Pings both backend and frontend every 5 minutes
 * to prevent Render free tier from spinning down (15 min inactivity).
 */
@Component
@Slf4j
public class KeepAliveScheduler {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    @Value("${app.keep-alive.backend-url:}")
    private String backendUrl;

    @Value("${app.keep-alive.frontend-url:}")
    private String frontendUrl;

    @Scheduled(fixedRate = 300000) // every 5 minutes
    public void pingServices() {
        ping("backend", backendUrl, "/ping");
        ping("frontend", frontendUrl, "");
    }

    private void ping(String service, String baseUrl, String path) {
        if (baseUrl == null || baseUrl.isBlank()) {
            return;
        }
        try {
            String url = baseUrl + path;
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(60))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            log.debug("Keep-alive ping {} → HTTP {}", service, response.statusCode());
        } catch (Exception e) {
            log.warn("Keep-alive ping {} failed: {}", service, e.getMessage());
        }
    }
}
