package com.ultron.backend.controller;

import com.ultron.backend.service.DataNormalizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class PingController {

    private final DataNormalizationService dataNormalizationService;

    @GetMapping("/ping")
    public ResponseEntity<Map<String, Object>> ping() {
        return ResponseEntity.ok(Map.of(
                "status", "alive",
                "service", "crm-backend",
                "timestamp", Instant.now().toString()
        ));
    }

    @GetMapping("/admin/data/normalize")
    public ResponseEntity<Map<String, String>> normalize() {
        String result = dataNormalizationService.normalizeData();
        return ResponseEntity.ok(Map.of("message", result));
    }
}
